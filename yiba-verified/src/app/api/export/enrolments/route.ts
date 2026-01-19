import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

/**
 * GET /api/export/enrolments
 * 
 * Export enrolments to CSV or JSON format.
 * - INSTITUTION_*: Export enrolments from their institution
 * - PLATFORM_ADMIN: Export all enrolments (app owners see everything! 🦸)
 * 
 * Query params:
 * - format: 'csv' | 'json' (default: 'csv')
 * - institution_id: Filter by institution (for PLATFORM_ADMIN)
 * - q: Search query (learner name, national_id, qualification name)
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);
    const searchParams = request.nextUrl.searchParams;

    // Build where clause with institution scoping
    const where: any = {
      deleted_at: null, // Only non-deleted enrolments
    };

    // Enforce institution scoping rules
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId) {
        return fail(new AppError(ERROR_CODES.UNAUTHENTICATED, "Unauthorized: Institution context required", 401));
      }
      where.institution_id = ctx.institutionId;
    } else if (ctx.role === "PLATFORM_ADMIN") {
      // PLATFORM_ADMIN can filter by institution_id if provided
      const institutionId = searchParams.get("institution_id");
      if (institutionId) {
        where.institution_id = institutionId;
      }
    } else {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Insufficient permissions", 403));
    }

    // Search query
    const q = searchParams.get("q");
    if (q) {
      where.OR = [
        { learner: { first_name: { contains: q, mode: "insensitive" } } },
        { learner: { last_name: { contains: q, mode: "insensitive" } } },
        { learner: { national_id: { contains: q, mode: "insensitive" } } },
        { qualification: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    // Fetch enrolments with related data
    const enrolments = await prisma.enrolment.findMany({
      where,
      include: {
        learner: {
          select: {
            learner_id: true,
            national_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        qualification: {
          select: {
            qualification_id: true,
            name: true,
            code: true,
          },
        },
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Determine format (default: CSV)
    const format = searchParams.get("format") || "csv";

    if (format === "json") {
      return NextResponse.json(
        {
          count: enrolments.length,
          enrolments: enrolments.map((enrolment) => ({
            enrolment_id: enrolment.enrolment_id,
            learner_id: enrolment.learner_id,
            learner_name: `${enrolment.learner.first_name} ${enrolment.learner.last_name}`,
            learner_national_id: enrolment.learner.national_id,
            learner_email: enrolment.learner.email,
            qualification_id: enrolment.qualification_id,
            qualification_name: enrolment.qualification.name,
            qualification_code: enrolment.qualification.code,
            institution_id: enrolment.institution_id,
            institution_name: enrolment.institution.trading_name || enrolment.institution.legal_name,
            status: enrolment.status,
            start_date: enrolment.start_date?.toISOString() || null,
            end_date: enrolment.end_date?.toISOString() || null,
            created_at: enrolment.created_at.toISOString(),
            updated_at: enrolment.updated_at.toISOString(),
          })),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="enrolments-${new Date().toISOString().split("T")[0]}.json"`,
          },
        }
      );
    }

    // CSV format
    const csvRows: string[] = [];
    
    // Header row
    csvRows.push(
      "Enrolment ID,Learner ID,Learner Name,Learner National ID,Learner Email,Qualification ID,Qualification Name,Qualification Code,Institution ID,Institution Name,Status,Start Date,End Date,Created At,Updated At"
    );

    // Data rows
    for (const enrolment of enrolments) {
      const row = [
        enrolment.enrolment_id,
        enrolment.learner_id,
        `${enrolment.learner.first_name} ${enrolment.learner.last_name}`,
        enrolment.learner.national_id || "",
        enrolment.learner.email || "",
        enrolment.qualification_id,
        (enrolment.qualification.name || "").replace(/,/g, ";"),
        enrolment.qualification.code || "",
        enrolment.institution_id,
        (enrolment.institution.trading_name || enrolment.institution.legal_name || "").replace(/,/g, ";"),
        enrolment.status,
        enrolment.start_date?.toISOString().split("T")[0] || "",
        enrolment.end_date?.toISOString().split("T")[0] || "",
        enrolment.created_at.toISOString(),
        enrolment.updated_at.toISOString(),
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
      
      csvRows.push(row.join(","));
    }

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="enrolments-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("GET /api/export/enrolments error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to export enrolments", 500));
  }
}

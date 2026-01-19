import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

/**
 * GET /api/export/learners
 * 
 * Export learners to CSV or JSON format.
 * - INSTITUTION_*: Export learners from their institution
 * - PLATFORM_ADMIN: Export all learners (app owners see everything! 🦸)
 * 
 * Query params:
 * - format: 'csv' | 'json' (default: 'csv')
 * - institution_id: Filter by institution (for PLATFORM_ADMIN)
 * - q: Search query (name, national_id, email)
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);
    const searchParams = request.nextUrl.searchParams;

    // Build where clause with institution scoping
    const where: any = {
      deleted_at: null, // Only non-deleted learners
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
        { first_name: { contains: q, mode: "insensitive" } },
        { last_name: { contains: q, mode: "insensitive" } },
        { national_id: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    // Fetch learners with institution info
    const learners = await prisma.learner.findMany({
      where,
      include: {
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
          count: learners.length,
          learners: learners.map((learner) => ({
            learner_id: learner.learner_id,
            national_id: learner.national_id,
            first_name: learner.first_name,
            last_name: learner.last_name,
            email: learner.email,
            phone_number: learner.phone_number,
            date_of_birth: learner.date_of_birth?.toISOString() || null,
            gender: learner.gender,
            institution_id: learner.institution_id,
            institution_name: learner.institution.trading_name || learner.institution.legal_name,
            created_at: learner.created_at.toISOString(),
            updated_at: learner.updated_at.toISOString(),
          })),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="learners-${new Date().toISOString().split("T")[0]}.json"`,
          },
        }
      );
    }

    // CSV format
    const csvRows: string[] = [];
    
    // Header row
    csvRows.push(
      "Learner ID,National ID,First Name,Last Name,Email,Phone Number,Date of Birth,Gender,Institution ID,Institution Name,Created At,Updated At"
    );

    // Data rows
    for (const learner of learners) {
      const row = [
        learner.learner_id,
        learner.national_id || "",
        learner.first_name || "",
        learner.last_name || "",
        learner.email || "",
        learner.phone_number || "",
        learner.date_of_birth?.toISOString().split("T")[0] || "",
        learner.gender || "",
        learner.institution_id,
        (learner.institution.trading_name || learner.institution.legal_name || "").replace(/,/g, ";"),
        learner.created_at.toISOString(),
        learner.updated_at.toISOString(),
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
      
      csvRows.push(row.join(","));
    }

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="learners-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("GET /api/export/learners error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to export learners", 500));
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { canAccessQctoData } from "@/lib/rbac";

/**
 * GET /api/export/readiness
 * 
 * Export readiness records to CSV or JSON format.
 * - INSTITUTION_*: Export readiness records from their institution
 * - PLATFORM_ADMIN: Export all readiness records (app owners see everything! 🦸)
 * - QCTO_USER: Export all readiness records (REPORTS_VIEW, Form 5 reviews)
 * 
 * Query params:
 * - format: 'csv' | 'json' (default: 'csv')
 * - institution_id: Filter by institution (for PLATFORM_ADMIN and QCTO_USER)
 * - status: Filter by readiness status
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);
    const searchParams = request.nextUrl.searchParams;

    // Build where clause with institution scoping
    const where: any = {
      deleted_at: null, // Only non-deleted readiness records
    };

    // Enforce institution scoping rules
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId) {
        return fail(new AppError(ERROR_CODES.UNAUTHENTICATED, "Unauthorized: Institution context required", 401));
      }
      where.institution_id = ctx.institutionId;
    } else if (canAccessQctoData(ctx.role)) {
      // QCTO and platform administrators can filter by institution_id if provided
      const institutionId = searchParams.get("institution_id");
      if (institutionId) {
        where.institution_id = institutionId;
      }
    } else {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Insufficient permissions", 403));
    }

    // Filter by status
    const status = searchParams.get("status");
    if (status) {
      where.readiness_status = status;
    }

    // Fetch readiness records with institution info
    const readinessRecords = await prisma.readiness.findMany({
      where,
      include: {
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
        _count: {
          select: {
            documents: true,
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
          count: readinessRecords.length,
          readiness: readinessRecords.map((readiness) => ({
            readiness_id: readiness.readiness_id,
            institution_id: readiness.institution_id,
            institution_name: readiness.institution.trading_name || readiness.institution.legal_name,
            qualification_title: readiness.qualification_title,
            saqa_id: readiness.saqa_id,
            nqf_level: readiness.nqf_level,
            curriculum_code: readiness.curriculum_code,
            delivery_mode: readiness.delivery_mode,
            readiness_status: readiness.readiness_status,
            documents_count: readiness._count.documents,
            created_at: readiness.created_at.toISOString(),
            updated_at: readiness.updated_at.toISOString(),
          })),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="readiness-${new Date().toISOString().split("T")[0]}.json"`,
          },
        }
      );
    }

    // CSV format
    const csvRows: string[] = [];
    
    // Header row
    csvRows.push(
      "Readiness ID,Institution ID,Institution Name,Qualification Title,SAQA ID,NQF Level,Curriculum Code,Delivery Mode,Status,Documents Count,Created At,Updated At"
    );

    // Data rows
    for (const readiness of readinessRecords) {
      const row = [
        readiness.readiness_id,
        readiness.institution_id,
        (readiness.institution.trading_name || readiness.institution.legal_name || "").replace(/,/g, ";"),
        (readiness.qualification_title || "").replace(/,/g, ";"),
        readiness.saqa_id || "",
        readiness.nqf_level?.toString() || "",
        readiness.curriculum_code || "",
        readiness.delivery_mode || "",
        readiness.readiness_status,
        readiness._count.documents,
        readiness.created_at.toISOString(),
        readiness.updated_at.toISOString(),
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
      
      csvRows.push(row.join(","));
    }

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="readiness-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("GET /api/export/readiness error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to export readiness records", 500));
  }
}

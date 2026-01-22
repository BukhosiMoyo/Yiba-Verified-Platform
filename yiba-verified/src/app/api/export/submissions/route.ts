import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

/**
 * GET /api/export/submissions
 * 
 * Export submissions to CSV or JSON format.
 * - INSTITUTION_*: Export submissions from their institution
 * - QCTO_USER: Export all submissions they can access
 * - PLATFORM_ADMIN: Export all submissions (app owners see everything! 🦸)
 * 
 * Query params:
 * - format: 'csv' | 'json' (default: 'csv')
 * - institution_id: Filter by institution (for PLATFORM_ADMIN)
 * - status: Filter by status
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);
    const searchParams = request.nextUrl.searchParams;

    // Build where clause with institution scoping
    const where: any = {
      deleted_at: null, // Only non-deleted submissions
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
    }
    // QCTO_USER sees all submissions (no additional filtering needed here)

    // Filter by status
    const status = searchParams.get("status");
    if (status) {
      where.status = status;
    }

    // Fetch submissions with institution info
    const submissions = await prisma.submission.findMany({
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
            submissionResources: true,
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
          count: submissions.length,
          submissions: submissions.map((submission) => ({
            submission_id: submission.submission_id,
            institution_id: submission.institution_id,
            institution_name: submission.institution.trading_name || submission.institution.legal_name,
            title: submission.title,
            description: submission.review_notes ?? null,
            status: submission.status,
            submitted_at: submission.submitted_at?.toISOString() || null,
            reviewed_at: submission.reviewed_at?.toISOString() || null,
            resources_count: submission._count.submissionResources,
            created_at: submission.created_at.toISOString(),
            updated_at: submission.updated_at.toISOString(),
          })),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="submissions-${new Date().toISOString().split("T")[0]}.json"`,
          },
        }
      );
    }

    // CSV format
    const csvRows: string[] = [];
    
    // Header row
    csvRows.push(
      "Submission ID,Institution ID,Institution Name,Title,Description,Status,Submitted At,Reviewed At,Resources Count,Created At,Updated At"
    );

    // Data rows
    for (const submission of submissions) {
      const row = [
        submission.submission_id,
        submission.institution_id,
        (submission.institution.trading_name || submission.institution.legal_name || "").replace(/,/g, ";"),
        (submission.title || "").replace(/,/g, ";"),
        (submission.review_notes || "").replace(/,/g, ";"),
        submission.status,
        submission.submitted_at?.toISOString() || "",
        submission.reviewed_at?.toISOString() || "",
        submission._count.submissionResources,
        submission.created_at.toISOString(),
        submission.updated_at.toISOString(),
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
      
      csvRows.push(row.join(","));
    }

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="submissions-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("GET /api/export/submissions error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to export submissions", 500));
  }
}

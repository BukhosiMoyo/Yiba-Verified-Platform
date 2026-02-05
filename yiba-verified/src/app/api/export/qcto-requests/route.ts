import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { canAccessQctoData } from "@/lib/rbac";

/**
 * GET /api/export/qcto-requests
 *
 * Export QCTO requests to CSV or JSON.
 * - QCTO_USER and PLATFORM_ADMIN (REPORTS_EXPORT)
 *
 * Query params:
 * - format: 'csv' | 'json' (default: 'csv')
 * - institution_id: Filter by institution
 * - status: PENDING | APPROVED | REJECTED
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    if (!canAccessQctoData(ctx.role)) {
      return fail(
        new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only QCTO and platform administrators can export QCTO requests", 403)
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const where: Record<string, unknown> = { deleted_at: null };

    const institutionId = searchParams.get("institution_id");
    if (institutionId) where.institution_id = institutionId;

    const status = searchParams.get("status");
    if (status) {
      // Allow any status, or validate against new enum if strict
      where.status = status;
    }

    const EXPORT_MAX_ROWS = 50_000;
    const requests = await prisma.qCTORequest.findMany({
      where,
      take: EXPORT_MAX_ROWS,
      orderBy: { requested_at: "desc" },
      include: {
        institution: { select: { institution_id: true, legal_name: true, trading_name: true } },
        requestedByUser: { select: { first_name: true, last_name: true, email: true } },
        reviewedByUser: { select: { first_name: true, last_name: true, email: true } },
      },
    });

    const format = searchParams.get("format") || "csv";

    const toName = (u: { first_name: string; last_name: string; email: string } | null) =>
      u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email : "";

    if (format === "json") {
      return NextResponse.json(
        {
          count: requests.length,
          qcto_requests: requests.map((r) => ({
            request_id: r.request_id,
            reference_code: r.reference_code,
            institution_id: r.institution_id,
            institution_name: r.institution.trading_name || r.institution.legal_name,
            title: r.title,
            description: r.description,
            type: r.type,
            status: r.status,
            requested_at: r.requested_at?.toISOString() ?? null,
            due_at: r.due_at?.toISOString() ?? null,
            requested_by: toName(r.requestedByUser),
            requested_by_email: r.requestedByUser?.email ?? null,
            reviewed_at: r.reviewed_at?.toISOString() ?? null,
            reviewed_by: toName(r.reviewedByUser),
            response_notes: r.response_notes,
            decision: r.decision,
            decision_notes: r.decision_notes,
            created_at: r.created_at.toISOString(),
            updated_at: r.updated_at.toISOString(),
          })),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="qcto-requests-${new Date().toISOString().split("T")[0]}.json"`,
          },
        }
      );
    }

    const csvRows: string[] = [
      "Request ID,Reference Code,Institution ID,Institution Name,Title,Description,Type,Status,Requested At,Due At,Requested By,Requested By Email,Reviewed At,Reviewed By,Response Notes,Decision,Decision Notes,Created At,Updated At",
    ];
    for (const r of requests) {
      const row = [
        r.request_id,
        r.reference_code || "",
        r.institution_id,
        (r.institution.trading_name || r.institution.legal_name || "").replace(/,/g, ";"),
        (r.title || "").replace(/,/g, ";"),
        (r.description || "").replace(/,/g, ";"),
        r.type || "",
        r.status,
        r.requested_at?.toISOString() || "",
        r.due_at?.toISOString() || "",
        toName(r.requestedByUser).replace(/,/g, ";"),
        r.requestedByUser?.email || "",
        r.reviewed_at?.toISOString() || "",
        toName(r.reviewedByUser).replace(/,/g, ";"),
        (r.response_notes || "").replace(/,/g, ";"),
        r.decision || "",
        (r.decision_notes || "").replace(/,/g, ";"),
        r.created_at.toISOString(),
        r.updated_at.toISOString(),
      ].map((f) => `"${String(f).replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    }

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="qcto-requests-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/export/qcto-requests error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to export QCTO requests", 500));
  }
}

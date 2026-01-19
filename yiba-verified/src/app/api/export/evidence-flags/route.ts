import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

/**
 * GET /api/export/evidence-flags
 *
 * Export evidence flags to CSV or JSON.
 * - QCTO_USER and PLATFORM_ADMIN (EVIDENCE_VIEW, REPORTS_EXPORT)
 *
 * Query params:
 * - format: 'csv' | 'json' (default: 'csv')
 * - status: ACTIVE | RESOLVED
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    if (ctx.role !== "PLATFORM_ADMIN" && ctx.role !== "QCTO_USER") {
      return fail(
        new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only platform admins and QCTO users can export evidence flags", 403)
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const where: Record<string, unknown> = {};

    const status = searchParams.get("status");
    if (status && ["ACTIVE", "RESOLVED"].includes(status)) where.status = status;

    const flags = await prisma.evidenceFlag.findMany({
      where,
      include: {
        flaggedByUser: { select: { first_name: true, last_name: true, email: true } },
        resolvedByUser: { select: { first_name: true, last_name: true, email: true } },
        document: {
          select: {
            document_id: true,
            file_name: true,
            document_type: true,
            related_entity: true,
            related_entity_id: true,
            status: true,
            institution: { select: { institution_id: true, legal_name: true, trading_name: true } },
            enrolment: { select: { institution: { select: { legal_name: true, trading_name: true } } } },
            learner: { select: { institution: { select: { legal_name: true, trading_name: true } } } },
            readiness: { select: { institution: { select: { legal_name: true, trading_name: true } } } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const format = searchParams.get("format") || "csv";

    const toName = (u: { first_name: string; last_name: string; email?: string } | null) =>
      u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "" : "";

    function instName(d: (typeof flags)[0]["document"]) {
      return (
        d.institution?.trading_name ||
        d.institution?.legal_name ||
        d.enrolment?.institution?.trading_name ||
        d.enrolment?.institution?.legal_name ||
        d.learner?.institution?.trading_name ||
        d.learner?.institution?.legal_name ||
        d.readiness?.institution?.trading_name ||
        d.readiness?.institution?.legal_name ||
        ""
      );
    }

    if (format === "json") {
      return NextResponse.json(
        {
          count: flags.length,
          evidence_flags: flags.map((f) => ({
            flag_id: f.flag_id,
            document_id: f.document_id,
            file_name: f.document.file_name,
            document_type: f.document.document_type,
            related_entity: f.document.related_entity,
            related_entity_id: f.document.related_entity_id,
            institution_name: instName(f.document),
            reason: f.reason,
            status: f.status,
            created_at: f.created_at.toISOString(),
            flagged_by: toName(f.flaggedByUser),
            flagged_by_email: f.flaggedByUser?.email ?? null,
            resolved_at: f.resolved_at?.toISOString() ?? null,
            resolved_by: toName(f.resolvedByUser),
          })),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="evidence-flags-${new Date().toISOString().split("T")[0]}.json"`,
          },
        }
      );
    }

    const csvRows: string[] = [
      "Flag ID,Document ID,File Name,Document Type,Related Entity,Related Entity ID,Institution Name,Reason,Status,Created At,Flagged By,Flagged By Email,Resolved At,Resolved By",
    ];
    for (const f of flags) {
      const row = [
        f.flag_id,
        f.document_id,
        (f.document.file_name || "").replace(/,/g, ";"),
        f.document.document_type || "",
        f.document.related_entity || "",
        f.document.related_entity_id || "",
        instName(f.document).replace(/,/g, ";"),
        (f.reason || "").replace(/,/g, ";"),
        f.status,
        f.created_at.toISOString(),
        toName(f.flaggedByUser).replace(/,/g, ";"),
        f.flaggedByUser?.email || "",
        f.resolved_at?.toISOString() || "",
        toName(f.resolvedByUser).replace(/,/g, ";"),
      ].map((x) => `"${String(x).replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    }

    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="evidence-flags-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/export/evidence-flags error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to export evidence flags", 500));
  }
}

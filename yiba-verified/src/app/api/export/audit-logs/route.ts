import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

/**
 * GET /api/export/audit-logs
 * 
 * Export audit logs to CSV or JSON format.
 * - PLATFORM_ADMIN and QCTO_USER can export (AUDIT_EXPORT)
 * 
 * Query params:
 * - format: 'csv' | 'json' (default: 'csv')
 * - entity_type, entity_id, change_type, institution_id, changed_by: Filters
 * - start_date, end_date: Date range filters
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    // PLATFORM_ADMIN and QCTO_USER can export audit logs (AUDIT_EXPORT capability)
    if (ctx.role !== "PLATFORM_ADMIN" && ctx.role !== "QCTO_USER") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Unauthorized: Only platform admins and QCTO users can export audit logs", 403));
    }

    const searchParams = request.nextUrl.searchParams;

    // Build where clause (same as audit-logs API endpoint)
    const where: any = {};

    if (searchParams.get("entity_type")) {
      where.entity_type = searchParams.get("entity_type");
    }

    if (searchParams.get("entity_id")) {
      where.entity_id = searchParams.get("entity_id");
    }

    if (searchParams.get("change_type")) {
      where.change_type = searchParams.get("change_type");
    }

    if (searchParams.get("institution_id")) {
      where.institution_id = searchParams.get("institution_id");
    }

    if (searchParams.get("changed_by")) {
      where.changed_by = searchParams.get("changed_by");
    }

    if (searchParams.get("start_date") || searchParams.get("end_date")) {
      where.changed_at = {};
      if (searchParams.get("start_date")) {
        where.changed_at.gte = new Date(searchParams.get("start_date")!);
      }
      if (searchParams.get("end_date")) {
        const endDate = new Date(searchParams.get("end_date")!);
        endDate.setHours(23, 59, 59, 999); // End of day
        where.changed_at.lte = endDate;
      }
    }

    // Fetch audit logs (no pagination for exports)
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        changedBy: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
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
      orderBy: { changed_at: "desc" },
    });

    // Determine format (default: CSV)
    const format = searchParams.get("format") || "csv";

    if (format === "json") {
      return NextResponse.json(
        {
          count: auditLogs.length,
          audit_logs: auditLogs.map((log) => ({
            audit_id: log.audit_id,
            entity_type: log.entity_type,
            entity_id: log.entity_id,
            field_name: log.field_name,
            old_value: log.old_value,
            new_value: log.new_value,
            change_type: log.change_type,
            action: log.action,
            institution_id: log.institution_id,
            institution_name: log.institution
              ? log.institution.trading_name || log.institution.legal_name
              : null,
            changed_by: log.changed_by,
            changed_by_name: log.changedBy
              ? `${log.changedBy.first_name || ""} ${log.changedBy.last_name || ""}`.trim() || log.changedBy.email
              : log.changed_by,
            changed_by_email: log.changedBy?.email || null,
            role_at_time: log.role_at_time,
            changed_at: log.changed_at.toISOString(),
          })),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.json"`,
          },
        }
      );
    }

    // CSV format
    const csvRows: string[] = [];
    
    // Header row
    csvRows.push(
      "Audit ID,Entity Type,Entity ID,Field Name,Old Value,New Value,Change Type,Action,Institution ID,Institution Name,Changed By,Changed By Name,Changed By Email,Role At Time,Changed At"
    );

    // Data rows
    for (const log of auditLogs) {
      const row = [
        log.audit_id,
        log.entity_type,
        log.entity_id,
        log.field_name || "",
        (log.old_value || "").replace(/,/g, ";").replace(/\n/g, " "),
        (log.new_value || "").replace(/,/g, ";").replace(/\n/g, " "),
        log.change_type,
        log.action || "",
        log.institution_id || "",
        log.institution
          ? (log.institution.trading_name || log.institution.legal_name || "").replace(/,/g, ";")
          : "",
        log.changed_by,
        log.changedBy
          ? `${log.changedBy.first_name || ""} ${log.changedBy.last_name || ""}`.trim() || log.changedBy.email
          : log.changed_by,
        log.changedBy?.email || "",
        log.role_at_time,
        log.changed_at.toISOString(),
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
      
      csvRows.push(row.join(","));
    }

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("GET /api/export/audit-logs error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to export audit logs", 500));
  }
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogFilters } from "@/components/platform-admin/AuditLogFilters";
import { AuditLogsTableClient } from "@/app/platform-admin/audit-logs/AuditLogsTableClient";
import { ExportButton } from "@/components/shared/ExportButton";

const BASE_PATH = "/qcto/audit-logs";

interface PageProps {
  searchParams: Promise<{
    entity_type?: string;
    entity_id?: string;
    change_type?: string;
    institution_id?: string;
    changed_by?: string;
    start_date?: string;
    end_date?: string;
    limit?: string;
    offset?: string;
  }>;
}

/**
 * QCTO Audit Logs Page
 *
 * Displays audit logs for QCTO_USER and PLATFORM_ADMIN.
 * Same data and filters as platform-admin audit logs; QCTO has AUDIT_VIEW capability.
 */
export default async function QctoAuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "QCTO_USER" && role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      queryParams.append(key, value);
    }
  });
  const queryString = queryParams.toString();

  const limit = Math.min(parseInt(params.limit || "50"), 200);
  const offset = parseInt(params.offset || "0");

  const where: Record<string, unknown> = {};
  if (params.entity_type) where.entity_type = params.entity_type;
  if (params.entity_id) where.entity_id = params.entity_id;
  if (params.change_type) where.change_type = params.change_type;
  if (params.institution_id) where.institution_id = params.institution_id;
  if (params.changed_by) where.changed_by = params.changed_by;
  if (params.start_date || params.end_date) {
    where.changed_at = {};
    if (params.start_date) {
      (where.changed_at as Record<string, Date>).gte = new Date(params.start_date);
    }
    if (params.end_date) {
      (where.changed_at as Record<string, Date>).lte = new Date(params.end_date);
    }
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
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
        relatedSubmission: {
          select: {
            submission_id: true,
            title: true,
            status: true,
          },
        },
        relatedQCTORequest: {
          select: {
            request_id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { changed_at: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return (
    <div className="space-y-6 p-4 md:p-8 min-w-0 max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-2">
            Complete audit trail of all system changes
          </p>
        </div>
        <ExportButton exportUrl={`/api/export/audit-logs?${queryString}`} />
      </div>

      <AuditLogFilters searchParams={params} basePath={BASE_PATH} />

      <AuditLogsTableClient
        logs={logs}
        totalCount={totalCount}
        limit={limit}
        offset={offset}
        params={params}
        basePath={BASE_PATH}
      />
    </div>
  );
}

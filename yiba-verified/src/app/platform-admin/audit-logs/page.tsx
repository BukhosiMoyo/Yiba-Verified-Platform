import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogFilters } from "@/components/platform-admin/AuditLogFilters";
import { AuditLogsTableClient } from "./AuditLogsTableClient";
import { ExportButton } from "@/components/shared/ExportButton";

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
 * Platform Admin Audit Logs Page
 * 
 * Displays all audit logs with filtering capabilities.
 * - Only PLATFORM_ADMIN can access
 * - Shows who changed what, when, and why
 * - Includes before/after values for updates
 * - Links to related entities (submissions, requests)
 */
export default async function AuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Build API query string from params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      queryParams.append(key, value);
    }
  });
  const queryString = queryParams.toString();

  // Fetch audit logs from API
  // Note: We could call the API endpoint directly, but for now we'll use the same pattern
  // as other pages and fetch from DB directly with proper scoping
  const limit = Math.min(parseInt(params.limit || "50"), 200);
  const offset = parseInt(params.offset || "0");

  // Build where clause
  const where: any = {};

  if (params.entity_type) {
    where.entity_type = params.entity_type;
  }

  if (params.entity_id) {
    where.entity_id = params.entity_id;
  }

  if (params.change_type) {
    where.change_type = params.change_type;
  }

  if (params.institution_id) {
    where.institution_id = params.institution_id;
  }

  if (params.changed_by) {
    where.changed_by = params.changed_by;
  }

  if (params.start_date || params.end_date) {
    where.changed_at = {};
    if (params.start_date) {
      where.changed_at.gte = new Date(params.start_date);
    }
    if (params.end_date) {
      where.changed_at.lte = new Date(params.end_date);
    }
  }

  // Fetch audit logs with related data
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
      orderBy: {
        changed_at: "desc",
      },
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

        {/* Filters */}
        <AuditLogFilters searchParams={params} />

        {/* Table: summary, pagination, empty state, view drawer */}
        <AuditLogsTableClient
          logs={logs}
          totalCount={totalCount}
          limit={limit}
          offset={offset}
          params={params}
        />
    </div>
  );
}

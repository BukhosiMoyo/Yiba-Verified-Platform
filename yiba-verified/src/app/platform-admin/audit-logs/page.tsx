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
  const [rawLogs, totalCount] = await Promise.all([
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

  // Helper function to check if a string is a valid UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Helper function to extract UUID from a value (handles JSON-stringified and plain strings)
  const extractInstitutionId = (value: string | null): string | null => {
    if (!value || value === "" || value === "null") return null;

    let extractedId: string | null = null;

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "string" && parsed.trim() !== "") {
        extractedId = parsed.trim();
      }
    } catch {
      if (value.trim() !== "" && value !== "null") {
        extractedId = value.trim();
      }
    }

    if (extractedId && isUUID(extractedId)) return extractedId;
    return null;
  };

  // Batch collect institution IDs (from institution_id field) and USER entity_ids
  const institutionIds = new Set<string>();
  const userIds = new Set<string>();
  for (const log of rawLogs) {
    if (log.field_name === "institution_id") {
      const o = extractInstitutionId(log.old_value);
      const n = extractInstitutionId(log.new_value);
      if (o) institutionIds.add(o);
      if (n) institutionIds.add(n);
    }
    if (log.entity_type === "USER" && isUUID(log.entity_id)) {
      userIds.add(log.entity_id);
    }
  }

  // Batch fetch institutions and users
  const [institutions, users] = await Promise.all([
    institutionIds.size > 0
      ? prisma.institution.findMany({
          where: { institution_id: { in: [...institutionIds] } },
          select: { institution_id: true, legal_name: true, trading_name: true },
        })
      : [],
    userIds.size > 0
      ? prisma.user.findMany({
          where: { user_id: { in: [...userIds] } },
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            role: true,
            status: true,
            institution: {
              select: { institution_id: true, legal_name: true, trading_name: true },
            },
          },
        })
      : [],
  ]);

  const institutionMap = new Map(institutions.map((i) => [i.institution_id, i]));
  const userMap = new Map(users.map((u) => [u.user_id, u]));

  // Resolve additional data in memory (no per-log DB calls)
  const logs = rawLogs.map((log) => {
    const resolvedLog: any = { ...log };

    if (log.field_name === "institution_id") {
      const oldId = extractInstitutionId(log.old_value);
      const newId = extractInstitutionId(log.new_value);
      const oldInstitution = oldId ? institutionMap.get(oldId) ?? null : null;
      const newInstitution = newId ? institutionMap.get(newId) ?? null : null;
      resolvedLog.oldInstitution = oldInstitution
        ? { institution_id: oldInstitution.institution_id, legal_name: oldInstitution.legal_name, trading_name: oldInstitution.trading_name }
        : null;
      resolvedLog.newInstitution = newInstitution
        ? { institution_id: newInstitution.institution_id, legal_name: newInstitution.legal_name, trading_name: newInstitution.trading_name }
        : null;
    }

    if (log.entity_type === "USER" && isUUID(log.entity_id)) {
      const userProfile = userMap.get(log.entity_id);
      if (userProfile) {
        resolvedLog.entityUser = {
          user_id: userProfile.user_id,
          email: userProfile.email,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          phone: userProfile.phone,
          role: userProfile.role,
          status: userProfile.status,
          institution: userProfile.institution
            ? { institution_id: userProfile.institution.institution_id, legal_name: userProfile.institution.legal_name, trading_name: userProfile.institution.trading_name }
            : null,
        };
      }
    }

    return resolvedLog;
  });

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

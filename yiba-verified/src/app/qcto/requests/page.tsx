import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessQctoData } from "@/lib/rbac";
import { getViewAsUserInfo } from "@/lib/viewAsUserServer";
import { getProvinceFilterForQCTO } from "@/lib/api/qctoAccess";
import type { ApiContext } from "@/lib/api/context";
import { QctoRequestsClient } from "./QctoRequestsClient";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { CreateQctoRequestDialog } from "@/components/qcto/CreateQctoRequestDialog";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    limit?: string;
    offset?: string;
  }>;
}

export default async function QctoRequestsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccessQctoData(session.user.role)) {
    redirect("/unauthorized");
  }

  const viewAsInfo = await getViewAsUserInfo(
    session.user.userId,
    session.user.role,
    session.user.name || "User"
  );
  const effectiveUserId = viewAsInfo?.viewingAsUserId ?? session.user.userId;
  const effectiveRole = viewAsInfo?.viewingAsRole ?? session.user.role;

  const ctx: ApiContext = {
    userId: effectiveUserId,
    role: effectiveRole,
    institutionId: null,
    qctoId: null,
  };
  const provinceFilter = await getProvinceFilterForQCTO(ctx);

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const statusParam = (params.status ?? "") as (typeof VALID_STATUSES)[number];
  const statusFilter = VALID_STATUSES.includes(statusParam) ? statusParam : "";
  const limitParam = parseInt(params.limit ?? String(DEFAULT_PAGE_SIZE), 10);
  const limit = (ROWS_PER_PAGE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;
  const offset = Math.max(0, parseInt(params.offset ?? "0", 10));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { deleted_at: null };

  if (effectiveRole === "QCTO_USER") {
    where.requested_by = effectiveUserId;
  }

  if (provinceFilter !== null && provinceFilter.length > 0) {
    where.institution = { province: { in: provinceFilter } };
  } else if (provinceFilter !== null && provinceFilter.length === 0) {
    return (
      <div className="space-y-4 md:space-y-8 p-4 md:p-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">QCTO Requests</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            No provinces assigned. Contact an administrator to get access.
          </p>
        </div>
        <Suspense fallback={<LoadingTable columns={10} rows={6} />}>
          <QctoRequestsClient
            requests={[]}
            total={0}
            isYourRequestsOnly={effectiveRole === "QCTO_USER"}
            initialQ=""
            initialStatus=""
            limit={DEFAULT_PAGE_SIZE}
            offset={0}
          />
        </Suspense>
      </div>
    );
  }

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (q.length >= 2) {
    where.AND = [
      {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { institution: { legal_name: { contains: q, mode: "insensitive" } } },
          { institution: { trading_name: { contains: q, mode: "insensitive" } } },
          { institution: { registration_number: { contains: q, mode: "insensitive" } } },
        ],
      },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.qCTORequest.findMany({
      where,
      select: {
        request_id: true,
        reference_code: true,
        institution_id: true,
        title: true,
        type: true,
        status: true,
        requested_at: true,
        due_at: true,
        reviewed_at: true,
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
            registration_number: true,
          },
        },
        _count: { select: { evidenceLinks: true } },
      },
      orderBy: { requested_at: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.qCTORequest.count({ where }),
  ]);

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex flex-wrap items-center gap-2">
            QCTO Requests
            {statusFilter && (
              <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm font-semibold bg-muted/50">
                {statusFilter === "PENDING" ? "Pending" : statusFilter === "APPROVED" ? "Approved" : "Rejected"}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Manage requests for access to institution resources
          </p>
        </div>

        {effectiveRole !== "INSTITUTION_ADMIN" && (
          <CreateQctoRequestDialog />
        )}
      </div>

      <Suspense fallback={<LoadingTable columns={10} rows={6} />}>
        <QctoRequestsClient
          requests={requests}
          total={total}
          isYourRequestsOnly={effectiveRole === "QCTO_USER"}
          initialQ={q}
          initialStatus={statusFilter}
          limit={limit}
          offset={offset}
        />
      </Suspense>
    </div>
  );
}

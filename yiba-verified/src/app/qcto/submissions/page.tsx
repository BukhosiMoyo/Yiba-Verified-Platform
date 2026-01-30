import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessQctoData } from "@/lib/rbac";
import { getViewAsUserInfo } from "@/lib/viewAsUserServer";
import { getProvinceFilterForQCTO } from "@/lib/api/qctoAccess";
import type { ApiContext } from "@/lib/api/context";
import { QctoSubmissionsClient } from "./QctoSubmissionsClient";
import { LoadingTable } from "@/components/shared/LoadingTable";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const VALID_STATUSES = [
  "DRAFT",
  "PENDING",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "RETURNED_FOR_CORRECTION",
] as const;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    province?: string;
    limit?: string;
    offset?: string;
  }>;
}

export default async function QctoSubmissionsPage({ searchParams }: PageProps) {
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

  if (provinceFilter !== null && provinceFilter.length === 0) {
    return (
      <div className="space-y-4 md:space-y-8 p-4 md:p-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Submissions</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            No provinces assigned. Contact an administrator to get access.
          </p>
        </div>
        <Suspense fallback={<LoadingTable columns={9} rows={6} />}>
          <QctoSubmissionsClient
            submissions={[]}
            total={0}
            initialQ=""
            initialStatus=""
            initialProvince=""
            limit={DEFAULT_PAGE_SIZE}
            offset={0}
          />
        </Suspense>
      </div>
    );
  }

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const statusParam = params.status ?? "";
  const statusFilter = (VALID_STATUSES as readonly string[]).includes(statusParam)
    ? statusParam
    : "";
  const provinceParam = (params.province ?? "").trim();
  const limitParam = parseInt(params.limit ?? String(DEFAULT_PAGE_SIZE), 10);
  const limit = (ROWS_PER_PAGE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;
  const offset = Math.max(0, parseInt(params.offset ?? "0", 10));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let where: any = { deleted_at: null };

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (provinceFilter !== null && provinceFilter.length > 0) {
    where.institution = { province: { in: provinceFilter } };
  }
  if (provinceParam) {
    if (provinceFilter === null || provinceFilter.includes(provinceParam)) {
      where.institution = { ...where.institution, province: provinceParam };
    } else {
      return (
        <div className="space-y-4 md:space-y-8 p-4 md:p-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Submissions</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              You don&apos;t have access to the selected province.
            </p>
          </div>
          <Suspense fallback={<LoadingTable columns={9} rows={6} />}>
            <QctoSubmissionsClient
              submissions={[]}
              total={0}
              initialQ={q}
              initialStatus={statusFilter}
              initialProvince={provinceParam}
              limit={limit}
              offset={0}
            />
          </Suspense>
        </div>
      );
    }
  }

  if (q.length >= 2) {
    where = {
      AND: [
        where,
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { institution: { trading_name: { contains: q, mode: "insensitive" } } },
            { institution: { legal_name: { contains: q, mode: "insensitive" } } },
          ],
        },
      ],
    };
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
        submittedByUser: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        reviewedByUser: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        submissionResources: {
          select: {
            resource_id: true,
            resource_type: true,
            resource_id_value: true,
            added_at: true,
            notes: true,
          },
        },
      },
      orderBy: { submitted_at: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.submission.count({ where }),
  ]);

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <Suspense fallback={<LoadingTable columns={9} rows={6} />}>
        <QctoSubmissionsClient
          submissions={submissions}
          total={total}
          initialQ={q}
          initialStatus={statusFilter}
          initialProvince={provinceParam}
          limit={limit}
          offset={offset}
        />
      </Suspense>
    </div>
  );
}

import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessQctoData } from "@/lib/rbac";
import { getViewAsUserInfo } from "@/lib/viewAsUserServer";
import { getProvinceFilterForQCTO } from "@/lib/api/qctoAccess";
import type { ApiContext } from "@/lib/api/context";
import { QctoInstitutionsTableClient } from "./QctoInstitutionsTableClient";
import { LoadingTable } from "@/components/shared/LoadingTable";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    province?: string;
    limit?: string;
    offset?: string;
  }>;
}

export default async function QctoInstitutionsPage({ searchParams }: PageProps) {
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
      <div className="space-y-6 p-4 md:p-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Institutions</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            No provinces assigned. Contact an administrator to get access.
          </p>
        </div>
        <Suspense fallback={<LoadingTable columns={7} rows={5} />}>
          <QctoInstitutionsTableClient
            institutions={[]}
            total={0}
            initialQ=""
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
  const provinceParam = (params.province ?? "").trim();
  const limitParam = parseInt(params.limit ?? String(DEFAULT_PAGE_SIZE), 10);
  const limit = (ROWS_PER_PAGE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;
  const offset = Math.max(0, parseInt(params.offset ?? "0", 10));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { deleted_at: null };

  if (provinceFilter !== null) {
    where.province = { in: provinceFilter };
  }
  if (provinceParam) {
    if (provinceFilter === null || provinceFilter.includes(provinceParam)) {
      where.province = provinceParam;
    } else {
      return (
        <div className="space-y-6 p-4 md:p-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Institutions</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              You don&apos;t have access to the selected province.
            </p>
          </div>
          <Suspense fallback={<LoadingTable columns={7} rows={5} />}>
            <QctoInstitutionsTableClient
              institutions={[]}
              total={0}
              initialQ={q}
              initialProvince={provinceParam}
              limit={limit}
              offset={0}
            />
          </Suspense>
        </div>
      );
    }
  }

  if (q) {
    where.OR = [
      { legal_name: { contains: q, mode: "insensitive" } },
      { trading_name: { contains: q, mode: "insensitive" } },
      { registration_number: { contains: q, mode: "insensitive" } },
    ];
  }

  const [institutions, total] = await Promise.all([
    prisma.institution.findMany({
      where,
      select: {
        institution_id: true,
        legal_name: true,
        trading_name: true,
        province: true,
        registration_number: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.institution.count({ where }),
  ]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Institutions</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            View and manage institutions
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingTable columns={7} rows={5} />}>
        <QctoInstitutionsTableClient
          institutions={institutions}
          total={total}
          initialQ={q}
          initialProvince={provinceParam}
          limit={limit}
          offset={offset}
        />
      </Suspense>
    </div>
  );
}

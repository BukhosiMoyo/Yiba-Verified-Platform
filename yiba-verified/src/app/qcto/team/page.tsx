import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessQctoData } from "@/lib/rbac";
import { hasCap } from "@/lib/capabilities";
import { QctoTeamClient } from "./QctoTeamClient";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    limit?: string;
    offset?: string;
  }>;
}

export default async function QctoTeamPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccessQctoData(session.user.role)) {
    redirect("/unauthorized");
  }

  const role = session.user.role;
  if (!hasCap(role, "QCTO_TEAM_MANAGE")) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <EmptyState
          title="Access denied"
          description="You don't have permission to manage the QCTO team."
          icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
          variant="no-results"
        />
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/qcto">Back to QCTO</Link>
          </Button>
        </div>
      </div>
    );
  }

  let qctoId: string | null = (session.user as { qctoId?: string | null }).qctoId ?? null;
  if (!qctoId && role === "PLATFORM_ADMIN") {
    const org = await prisma.qCTOOrg.findFirst();
    if (org) qctoId = org.id;
  }
  if (!qctoId) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <EmptyState
          title="No QCTO access"
          description="No QCTO organisation is linked to your account."
          icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
          variant="no-results"
        />
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/qcto">Back to QCTO</Link>
          </Button>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const limitParam = parseInt(params.limit ?? String(DEFAULT_PAGE_SIZE), 10);
  const limit = (ROWS_PER_PAGE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;
  const offset = Math.max(0, parseInt(params.offset ?? "0", 10));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { qcto_id: qctoId, deleted_at: null };
  if (q.length >= 2) {
    where.OR = [
      { first_name: { contains: q, mode: "insensitive" } },
      { last_name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        image: true,
      },
      orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
      take: limit,
      skip: offset,
    }),
    prisma.user.count({ where }),
  ]);

  const members = users.map((u) => ({
    user_id: u.user_id,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    role: u.role,
    status: u.status,
    created_at: u.created_at,
    image: u.image,
    last_login: null as string | null,
  }));

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">QCTO Team</h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Manage reviewers, admins, and access levels for QCTO operations.
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingTable columns={5} rows={5} />}>
        <QctoTeamClient
          members={members}
          total={total}
          initialQ={q}
          limit={limit}
          offset={offset}
        />
      </Suspense>
    </div>
  );
}

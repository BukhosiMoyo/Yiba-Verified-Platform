import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UsersTableClient } from "./UsersTableClient";
import { LoadingTable } from "@/components/shared/LoadingTable";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const INSTITUTIONS_LIMIT = 100;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    institution_id?: string;
    limit?: string;
    offset?: string;
  }>;
}

export default async function PlatformAdminUsersPage({
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const roleFilter = params.role ?? "";
  const statusFilter = params.status ?? "";
  const institutionId = params.institution_id ?? "";
  const limitParam = parseInt(params.limit ?? String(DEFAULT_PAGE_SIZE), 10);
  const limit = (ROWS_PER_PAGE_OPTIONS as readonly number[]).includes(limitParam)
    ? limitParam
    : DEFAULT_PAGE_SIZE;
  const offset = Math.max(0, parseInt(params.offset ?? "0", 10));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { deleted_at: null };
  if (roleFilter) where.role = roleFilter;
  if (statusFilter) where.status = statusFilter;
  if (institutionId) where.institution_id = institutionId;
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { first_name: { contains: q, mode: "insensitive" } },
      { last_name: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, totalUsers, invites, totalInvites, institutions] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        phone: true,
        created_at: true,
        institution_id: true,
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.user.count({ where }),
    // Fetch pending invites (always show on first page or merge logic?)
    // For now, let's fetch them if offset is 0 (first page) so they appear at top.
    offset === 0 ? prisma.invite.findMany({
      where: {
        status: { not: "ACCEPTED" }, // Show QUEUED, SENT, FAILED, PENDING
        ...(q ? { email: { contains: q, mode: "insensitive" } } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(institutionId ? { institution_id: institutionId } : {}),
      },
      select: {
        invite_id: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        institution_id: true,
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" }
    }) : [],
    prisma.invite.count({
      where: {
        status: { not: "ACCEPTED" },
        ...(q ? { email: { contains: q, mode: "insensitive" } } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(institutionId ? { institution_id: institutionId } : {}),
      }
    }),
    prisma.institution.findMany({
      where: { deleted_at: null },
      select: {
        institution_id: true,
        legal_name: true,
        trading_name: true,
      },
      orderBy: { legal_name: "asc" },
      take: INSTITUTIONS_LIMIT,
    }),
  ]);

  // Map invites to UserRow shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inviteRows: any[] = invites.map(invite => ({
    user_id: invite.invite_id, // Use invite_id as key
    email: invite.email,
    first_name: "(Invited)",
    last_name: "",
    role: invite.role,
    status: invite.status === "QUEUED" ? "Queued" : (invite.status === "SENT" ? "Invited" : invite.status),
    phone: null,
    created_at: invite.created_at,
    institution_id: invite.institution_id,
    institution: invite.institution,
  }));

  const allRows = [...inviteRows, ...users];
  const total = totalUsers + totalInvites;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage platform users and their roles
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingTable columns={9} rows={5} />}>
        <UsersTableClient
          users={allRows}
          total={total}
          institutions={institutions}
          initialQ={q}
          initialRole={roleFilter}
          initialStatus={statusFilter}
          initialInstitutionId={institutionId}
          limit={limit}
          offset={offset}
        />
      </Suspense>
    </div>
  );
}

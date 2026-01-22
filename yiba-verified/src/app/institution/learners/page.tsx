import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { EmptyState } from "@/components/shared/EmptyState";
import { Suspense } from "react";
import { LearnersFilterBar } from "@/components/institution/LearnersFilterBar";
import { LearnersTable } from "@/components/institution/LearnersTable";
import { GraduationCap } from "lucide-react";

const LIMIT_OPTIONS = [10, 25, 50, 100] as const;

interface PageProps {
  searchParams: { q?: string; limit?: string; sort?: string; page?: string };
}

/**
 * Institution Learners List Page
 *
 * Displays learners for the institution.
 * - INSTITUTION_*: scoped to their institution_id
 * - PLATFORM_ADMIN: sees all (no institution filter when in institution area we still scope by institutionId if present)
 */
export default async function InstitutionLearnersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userInstitutionId = session.user.institutionId;

  if (!userInstitutionId) {
    return (
      <div className="p-4 md:p-8">
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-8 md:p-12">
          <EmptyState
            title="No institution"
            description="Your account is not linked to an institution. Contact an administrator."
            icon={<GraduationCap className="h-6 w-6" strokeWidth={1.5} />}
            variant="default"
          />
        </div>
      </div>
    );
  }

  const where: Prisma.LearnerWhereInput = {
    institution_id: userInstitutionId,
    deleted_at: null,
  };

  const q = (searchParams.q || "").trim();
  if (q) {
    where.OR = [
      { national_id: { contains: q, mode: "insensitive" } },
      { first_name: { contains: q, mode: "insensitive" } },
      { last_name: { contains: q, mode: "insensitive" } },
      { alternate_id: { contains: q, mode: "insensitive" } },
    ];
  }

  const sort = searchParams.sort || "name_asc";
  const orderBy =
    sort === "name_desc"
      ? [{ last_name: "desc" as const }, { first_name: "desc" as const }]
      : sort === "newest"
        ? [{ created_at: "desc" as const }]
        : sort === "oldest"
          ? [{ created_at: "asc" as const }]
          : [{ last_name: "asc" as const }, { first_name: "asc" as const }];

  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const limitParam = parseInt(searchParams.limit || "10", 10);
  const limit = (LIMIT_OPTIONS as readonly number[]).includes(limitParam) ? limitParam : 10;

  const [learners, total] = await Promise.all([
    prisma.learner.findMany({
      where,
      select: {
        learner_id: true,
        national_id: true,
        alternate_id: true,
        first_name: true,
        last_name: true,
        birth_date: true,
        created_at: true,
        user: { select: { email: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.learner.count({ where }),
  ]);

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 px-6 py-8 md:px-8 md:py-10 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.14)_0%,_transparent_50%)]" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <GraduationCap className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Learners</h1>
            <p className="mt-1 text-amber-100 text-sm md:text-base">
              Manage learners at your institution
            </p>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden border-l-4 border-l-amber-500">
        <Suspense fallback={<div className="border-b border-slate-200/80 bg-slate-50/30 px-4 py-4 md:px-6 md:py-5 h-[130px]" />}>
          <LearnersFilterBar total={total} />
        </Suspense>

        <div className="px-4 md:px-6 py-4 md:py-5">
          <LearnersTable learners={learners} total={total} page={page} limit={limit} q={q} sort={sort} />
        </div>
      </div>
    </div>
  );
}

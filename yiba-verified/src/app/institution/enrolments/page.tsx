import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EnrolmentsTable } from "@/components/institution/EnrolmentsTable";
import { ClipboardList } from "lucide-react";

interface PageProps {
  searchParams: {
    q?: string;
    limit?: string;
  };
}

/**
 * Enrolments List Page
 * 
 * Server Component that displays enrolments.
 * - Fetches enrolments from DB directly (read-only, no mutateWithAudit needed for reads)
 * - Institution scoping:
 *   - INSTITUTION_* roles: locked to their institution
 *   - PLATFORM_ADMIN: sees ALL enrolments (no institution filter - app owners see everything!)
 * - Ignores soft-deleted enrolments
 */
export default async function EnrolmentsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Build where clause with institution scoping
  const where: any = {
    deleted_at: null, // Only non-deleted enrolments
  };

  // Institution scoping - layout already ensures user has correct role
  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    // Institution roles must be scoped to their institution
    if (userInstitutionId) {
      where.institution_id = userInstitutionId;
    } else {
      // Return empty results if no institutionId (shouldn't happen in practice)
      where.institution_id = "__NO_INSTITUTION__"; // This will return no results
    }
  }
  // PLATFORM_ADMIN sees ALL enrolments (no institution_id filter - app owners see everything! 🦸)
  // They get all the juice - analytics, data about everyone, the whole enchilada!

  // Add search filter if provided
  const searchQuery = searchParams.q || "";
  if (searchQuery.trim()) {
    where.OR = [
      { learner: { national_id: { contains: searchQuery, mode: "insensitive" } } },
      { learner: { first_name: { contains: searchQuery, mode: "insensitive" } } },
      { learner: { last_name: { contains: searchQuery, mode: "insensitive" } } },
      { qualification: { name: { contains: searchQuery, mode: "insensitive" } } },
      { qualification_title: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // Parse limit
  const limit = Math.min(
    searchParams.limit ? parseInt(searchParams.limit, 10) : 50,
    200 // Cap at 200
  );

  // Fetch enrolments
  const enrolments = await prisma.enrolment.findMany({
    where,
    select: {
      enrolment_id: true,
      learner_id: true,
      qualification_id: true,
      qualification_title: true,
      start_date: true,
      expected_completion_date: true,
      enrolment_status: true,
      created_at: true,
      learner: {
        select: {
          national_id: true,
          first_name: true,
          last_name: true,
        },
      },
      qualification: {
        select: {
          qualification_id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: {
      created_at: "desc", // Newest first
    },
    take: limit,
  });

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700 px-6 py-8 md:px-8 md:py-10 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.14)_0%,_transparent_50%)]" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <ClipboardList className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Enrolments</h1>
            <p className="mt-1 text-violet-100 text-sm md:text-base">
              Manage learner enrolments for qualifications
            </p>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden border-l-4 border-l-violet-500">
        <div className="border-b border-slate-200/80 dark:border-border bg-slate-50/30 dark:bg-muted/30 px-4 py-4 md:px-6 md:py-5">
          <h2 className="text-lg font-semibold text-foreground">All Enrolments</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {enrolments.length} enrolment{enrolments.length !== 1 ? "s" : ""} found
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
        <div className="px-4 md:px-6 py-4 md:py-5">
          <EnrolmentsTable enrolments={enrolments} searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}

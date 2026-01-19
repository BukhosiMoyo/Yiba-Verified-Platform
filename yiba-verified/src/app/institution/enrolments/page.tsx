import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

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

  // Format dates for display
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      ACTIVE: "Active",
      COMPLETED: "Completed",
      TRANSFERRED: "Transferred",
      ARCHIVED: "Archived",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Enrolments</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          Manage learner enrolments for qualifications
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">All Enrolments</h2>
          <p className="text-sm text-muted-foreground">
            {enrolments.length} enrolment{enrolments.length !== 1 ? "s" : ""} found
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
        <ResponsiveTable>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>National ID</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expected Completion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12">
                    <EmptyState
                      title="No enrolments found"
                      description={
                        searchQuery
                          ? `No enrolments match "${searchQuery}". Try a different search term.`
                          : "Create an enrolment to link a learner to a qualification. Enrolments track the progress and status of learners in their qualifications."
                      }
                      icon={<GraduationCap className="h-6 w-6" strokeWidth={1.5} />}
                      variant={searchQuery ? "no-results" : "default"}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                enrolments.map((enrolment) => (
                  <TableRow key={enrolment.enrolment_id}>
                    <TableCell className="font-medium">
                      {enrolment.learner.first_name} {enrolment.learner.last_name}
                    </TableCell>
                    <TableCell>{enrolment.learner.national_id}</TableCell>
                    <TableCell>
                      {enrolment.qualification?.name || enrolment.qualification_title}
                      {enrolment.qualification?.code && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({enrolment.qualification.code})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(enrolment.start_date)}</TableCell>
                    <TableCell>{formatDate(enrolment.expected_completion_date)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          enrolment.enrolment_status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : enrolment.enrolment_status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800"
                            : enrolment.enrolment_status === "TRANSFERRED"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {formatStatus(enrolment.enrolment_status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/institution/enrolments/${enrolment.enrolment_id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
      </div>
    </div>
  );
}

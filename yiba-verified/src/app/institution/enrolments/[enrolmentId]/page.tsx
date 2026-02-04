import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{
    enrolmentId: string;
  }>;
}

/**
 * Enrolment Details Page
 * 
 * Server Component that displays enrolment details.
 * - Fetches enrolment from DB directly (read-only, no mutateWithAudit needed for reads)
 * - Enforces institution scoping:
 *   - INSTITUTION_* roles: must match ctx institution_id
 *   - PLATFORM_ADMIN: can view ALL enrolments (no institution scoping - app owners see everything!)
 * - Ignores soft-deleted enrolments (deleted_at must be null)
 */
export default async function EnrolmentDetailsPage({ params }: PageProps) {
  const { enrolmentId } = await params;

  // Get session (layout already ensures auth, but we need role/institutionId for scoping)
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Fetch enrolment from database
  const enrolment = await prisma.enrolment.findUnique({
    where: { enrolment_id: enrolmentId },
    select: {
      enrolment_id: true,
      learner_id: true,
      institution_id: true,
      qualification_id: true,
      qualification_title: true,
      start_date: true,
      expected_completion_date: true,
      enrolment_status: true,
      attendance_percentage: true,
      assessment_centre_code: true,
      readiness_status: true,
      flc_status: true,
      statement_number: true,
      created_at: true,
      updated_at: true,
      deleted_at: true, // Include to check soft-delete
      learner: {
        select: {
          learner_id: true,
          national_id: true,
          first_name: true,
          last_name: true,
          birth_date: true,
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
  });

  // Check if enrolment exists and is not soft-deleted
  if (!enrolment || enrolment.deleted_at !== null) {
    notFound();
  }

  // Enforce institution scoping rules
  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    // Institution roles can only view enrolments from their own institution
    if (!userInstitutionId) {
      redirect("/unauthorized");
    }

    if (userInstitutionId !== enrolment.institution_id) {
      redirect("/unauthorized");
    }
  }
  // PLATFORM_ADMIN can view ALL enrolments (no institution scoping check - app owners see everything! 🦸)

  // Format dates for display
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Enrolment Details</h1>
        <p className="text-muted-foreground mt-2">
          View enrolment information and details
        </p>
      </div>

      {/* Enrolment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolment Information</CardTitle>
          <CardDescription>
            Status:{" "}
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${enrolment.enrolment_status === "ACTIVE"
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
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Qualification
              </p>
              <p className="text-base">
                {enrolment.qualification?.name || enrolment.qualification_title}
                {enrolment.qualification?.code && (
                  <span className="text-sm text-muted-foreground ml-1">
                    ({enrolment.qualification.code})
                  </span>
                )}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Start Date
              </p>
              <p className="text-base">{formatDate(enrolment.start_date)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Expected Completion Date
              </p>
              <p className="text-base">
                {formatDate(enrolment.expected_completion_date)}
              </p>
            </div>

            {enrolment.attendance_percentage !== null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Attendance Percentage
                </p>
                <p className="text-base">{enrolment.attendance_percentage != null ? `${Number(enrolment.attendance_percentage)}%` : "—"}</p>
              </div>
            )}

            {enrolment.assessment_centre_code && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Assessment Centre Code
                </p>
                <p className="text-base">{enrolment.assessment_centre_code}</p>
              </div>
            )}

            {enrolment.readiness_status && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Readiness Status
                </p>
                <p className="text-base">{enrolment.readiness_status}</p>
              </div>
            )}

            {enrolment.flc_status && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  FLC Status
                </p>
                <p className="text-base">{enrolment.flc_status}</p>
              </div>
            )}

            {enrolment.statement_number && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Statement Number
                </p>
                <p className="text-base">{enrolment.statement_number}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Created At
              </p>
              <p className="text-base">{formatDateTime(enrolment.created_at)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Updated At
              </p>
              <p className="text-base">{formatDateTime(enrolment.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learner Information */}
      <Card>
        <CardHeader>
          <CardTitle>Learner Information</CardTitle>
          <CardDescription>Associated learner details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="text-base">
                {enrolment.learner.first_name} {enrolment.learner.last_name}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                National ID
              </p>
              <p className="text-base">{enrolment.learner.national_id}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Birth Date
              </p>
              <p className="text-base">
                {formatDate(enrolment.learner.birth_date)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Link
              href={`/institution/learners/${enrolment.learner_id}`}
              className="text-primary hover:underline text-sm font-medium"
            >
              View Full Learner Details
              <ArrowRight className="ml-1.5 h-4 w-4 inline-block" aria-hidden />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerateImpersonationLink } from "@/components/shared/GenerateImpersonationLink";

interface PageProps {
  params: Promise<{ learnerId: string }>;
}

/**
 * Learner Details Page
 * 
 * Server Component that displays learner details.
 * - Fetches learner from DB directly (read-only, no mutateWithAudit needed for reads)
 * - Enforces institution scoping:
 *   - INSTITUTION_* roles: must match ctx institution_id
 *   - PLATFORM_ADMIN: can view ALL learners (no institution scoping - app owners see everything!)
 * - Ignores soft-deleted learners (deleted_at must be null)
 */
export default async function LearnerDetailsPage({ params }: PageProps) {
  const { learnerId } = await params;

  // Get session (layout already ensures auth, but we need role/institutionId for scoping)
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userInstitutionId = session.user.institutionId;

  // Fetch learner from database
  const learner = await prisma.learner.findUnique({
    where: { learner_id: learnerId },
    select: {
      learner_id: true,
      institution_id: true,
      national_id: true,
      alternate_id: true,
      first_name: true,
      last_name: true,
      birth_date: true,
      gender_code: true,
      nationality_code: true,
      popia_consent: true,
      consent_date: true,
      created_at: true,
      deleted_at: true, // Include to check soft-delete
      user_id: true, // Include to check if learner has student account
    },
  });

  // Check if learner exists and is not soft-deleted
  if (!learner || learner.deleted_at !== null) {
    notFound();
  }

  // Get student user if learner has a linked user account
  let studentUser = null;
  if (learner.user_id) {
    studentUser = await prisma.user.findUnique({
      where: { user_id: learner.user_id },
      select: {
        user_id: true,
        role: true,
      },
    });
  }

  // Enforce institution scoping rules
  if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    // Institution roles can only view learners from their own institution
    if (!userInstitutionId) {
      redirect("/unauthorized");
    }

    if (userInstitutionId !== learner.institution_id) {
      redirect("/unauthorized");
    }
  }
  // PLATFORM_ADMIN can view ALL learners (no institution scoping check - app owners see everything! 🦸)

  // Format birth_date for display
  const birthDateFormatted = learner.birth_date
    ? new Date(learner.birth_date).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  // Format consent_date for display
  const consentDateFormatted = learner.consent_date
    ? new Date(learner.consent_date).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  // Format created_at for display
  const createdAtFormatted = learner.created_at
    ? new Date(learner.created_at).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learner Details</h1>
          <p className="text-muted-foreground mt-2">
            View learner information and details
          </p>
        </div>
        {studentUser && 
         (userRole === "INSTITUTION_ADMIN" || userRole === "PLATFORM_ADMIN") && 
         session.user.userId !== studentUser.user_id && (
          <GenerateImpersonationLink
            targetUserId={studentUser.user_id}
            targetUserName={`${learner.first_name} ${learner.last_name}`}
            targetUserRole={studentUser.role}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {learner.first_name} {learner.last_name}
          </CardTitle>
          <CardDescription>Learner Information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Full Name
              </p>
              <p className="text-base">
                {learner.first_name} {learner.last_name}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                National ID
              </p>
              <p className="text-base">{learner.national_id}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Gender Code
              </p>
              <p className="text-base">{learner.gender_code || "N/A"}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nationality Code
              </p>
              <p className="text-base">{learner.nationality_code || "N/A"}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Birth Date
              </p>
              <p className="text-base">{birthDateFormatted}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                POPIA Consent
              </p>
              <p className="text-base">
                {learner.popia_consent ? "Yes" : "No"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Consent Date
              </p>
              <p className="text-base">{consentDateFormatted}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Created At
              </p>
              <p className="text-base">{createdAtFormatted}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

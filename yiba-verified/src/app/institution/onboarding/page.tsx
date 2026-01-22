import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InstitutionAdminOnboardingWizard } from "@/components/institution/onboarding/InstitutionAdminOnboardingWizard";

/**
 * Institution Admin Onboarding Page
 * Simple welcome/acknowledgment for institution admins.
 */
export default async function InstitutionAdminOnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "INSTITUTION_ADMIN") {
    redirect("/unauthorized");
  }

  // Check onboarding status
  const user = await prisma.user.findUnique({
    where: { user_id: session.user.userId },
    select: {
      onboarding_completed: true,
    },
  });

  // If already completed, redirect to dashboard
  if (user?.onboarding_completed) {
    redirect("/institution");
  }

  return <InstitutionAdminOnboardingWizard />;
}

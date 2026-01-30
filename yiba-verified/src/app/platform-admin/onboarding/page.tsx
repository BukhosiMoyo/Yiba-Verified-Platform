import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlatformAdminOnboardingWizard } from "@/components/platform-admin/onboarding/PlatformAdminOnboardingWizard";

/**
 * Platform Admin Onboarding Page
 * Simple welcome/acknowledgment for platform admins.
 */
export default async function PlatformAdminOnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Check onboarding status by email (same as layout and API)
  const email = session.user.email;
  const user = email
    ? await prisma.user.findUnique({
        where: { email },
        select: { onboarding_completed: true },
      })
    : null;

  if (user?.onboarding_completed) {
    redirect("/platform-admin");
  }

  return <PlatformAdminOnboardingWizard />;
}

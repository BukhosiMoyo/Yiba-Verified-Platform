import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QctoOnboardingWizard } from "@/components/qcto/onboarding/QctoOnboardingWizard";

/**
 * QCTO Onboarding Page
 * Collects province assignment information for QCTO users.
 * Only accessible if onboarding is not completed.
 */
export default async function QctoOnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is a QCTO role
  const QCTO_ROLES = [
    "QCTO_SUPER_ADMIN",
    "QCTO_ADMIN",
    "QCTO_USER",
    "QCTO_REVIEWER",
    "QCTO_AUDITOR",
    "QCTO_VIEWER",
  ];

  if (!QCTO_ROLES.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  // Check onboarding status and fetch name for greeting
  const user = await prisma.user.findUnique({
    where: { user_id: session.user.userId },
    select: {
      onboarding_completed: true,
      default_province: true,
      assigned_provinces: true,
      first_name: true,
    },
  });

  // If already completed, redirect to dashboard
  if (user?.onboarding_completed) {
    redirect("/qcto");
  }

  const userName = user?.first_name?.trim() || session.user.name?.split(/\s+/)[0] || "there";

  return (
    <QctoOnboardingWizard
      initialData={user}
      userRole={session.user.role}
      userName={userName}
    />
  );
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentOnboardingWizard } from "@/components/student/onboarding/StudentOnboardingWizard";

/**
 * Student Onboarding Page
 * Full-page wizard for collecting required student information.
 * Only accessible if onboarding is not completed.
 */
export default async function StudentOnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is a student
  if (session.user.role !== "STUDENT") {
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
    redirect("/student");
  }

  return <StudentOnboardingWizard />;
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import { filterNavItems } from "@/components/layout/nav";
import { getStudentNavItems } from "@/lib/navigation";
import { authOptions } from "@/lib/auth";
import { OnboardingLayoutWrapper } from "@/components/student/onboarding/OnboardingLayoutWrapper";
import type { Role } from "@/lib/rbac";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "STUDENT") {
    redirect("/unauthorized");
  }

  const navigationItems = filterNavItems(role, getStudentNavItems());
  const userName = session.user.name || "User";

  return (
    <OnboardingLayoutWrapper
      withAppShell={
        <AppShell
          navigationItems={navigationItems}
          currentUserRole={role}
          userName={userName}
        >
          {children}
        </AppShell>
      }
    >
      {children}
    </OnboardingLayoutWrapper>
  );
}

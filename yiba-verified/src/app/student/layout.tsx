import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import { filterNavItems } from "@/components/layout/nav";
import { getStudentNavItems, getNavigationItemsForRole } from "@/lib/navigation";
import { authOptions } from "@/lib/auth";
import { OnboardingLayoutWrapper } from "@/components/student/onboarding/OnboardingLayoutWrapper";
import type { Role } from "@/lib/rbac";
import { getViewAsUserInfo } from "@/lib/viewAsUserServer";

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

  const userName = session.user.name || "User";

  // Get View As User info if applicable
  const viewAsInfo = await getViewAsUserInfo(
    session.user.userId,
    session.user.role,
    userName
  );

  // Use viewing as user's context if present, otherwise use actual user's context
  const displayRole = viewAsInfo?.viewingAsRole || role;
  const displayUserName = viewAsInfo?.viewingAsUserName || userName;

  // Get navigation items based on viewing-as role (if viewing as someone) or original role
  // This ensures sidebar links match the viewing-as user's role
  const baseNavItems = viewAsInfo?.viewingAsRole
    ? getNavigationItemsForRole(viewAsInfo.viewingAsRole)
    : getStudentNavItems();
  
  const navigationItems = filterNavItems(displayRole, baseNavItems);

  return (
    <OnboardingLayoutWrapper
      withAppShell={
        <AppShell
          navigationItems={navigationItems}
          currentUserRole={displayRole}
          userName={displayUserName}
          userId={viewAsInfo?.viewingAsUserId || session.user.userId}
          viewingAsUserId={viewAsInfo?.viewingAsUserId ?? null}
          viewingAsRole={viewAsInfo?.viewingAsRole ?? null}
          viewingAsUserName={viewAsInfo?.viewingAsUserName ?? null}
          originalUserName={viewAsInfo?.originalUserName}
          originalRole={viewAsInfo?.originalRole}
        >
          {children}
        </AppShell>
      }
    >
      {children}
    </OnboardingLayoutWrapper>
  );
}

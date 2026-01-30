import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { filterNavItems } from "@/components/layout/nav";
import { getAdvisorNavItems, getNavigationItemsForRole } from "@/lib/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessArea } from "@/lib/rbac";
import { getViewAsUserInfo } from "@/lib/viewAsUserServer";

const getCachedSession = cache(async () => {
  return getServerSession(authOptions);
});

export default async function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const userName = session.user.name || "User";

  const viewAsInfo = await getViewAsUserInfo(
    session.user.userId,
    session.user.role,
    userName
  );

  const displayRole = viewAsInfo?.viewingAsRole || role;
  const displayUserName = viewAsInfo?.viewingAsUserName || userName;

  const originalCanAccess = canAccessArea(role, "advisor") || role === "PLATFORM_ADMIN";
  const viewingAsCanAccess = displayRole ? (canAccessArea(displayRole, "advisor") || displayRole === "PLATFORM_ADMIN") : false;

  if (!originalCanAccess && !viewingAsCanAccess) {
    redirect("/unauthorized");
  }

  const baseNavItems = viewAsInfo?.viewingAsRole
    ? getNavigationItemsForRole(viewAsInfo.viewingAsRole)
    : getAdvisorNavItems();
  const navigationItems = filterNavItems(displayRole, baseNavItems);

  return (
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
  );
}

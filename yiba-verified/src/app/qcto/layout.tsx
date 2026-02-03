import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { filterNavItems } from "@/components/layout/nav";
import { getQctoNavItems, getNavigationItemsForRole } from "@/lib/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessArea } from "@/lib/rbac";
import { getViewAsUserInfo } from "@/lib/viewAsUserServer";
import { prisma } from "@/lib/prisma";
import { OnboardingGuard } from "@/components/qcto/OnboardingGuard";
import { unstable_cache } from "next/cache";

// Cache session fetching per request
const getCachedSession = cache(async () => {
  return getServerSession(authOptions);
});

// Cache user data per user (5 second cache)
const getCachedUserData = unstable_cache(
  async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        onboarding_completed: true,
        default_province: true,
        assigned_provinces: true,
      },
    });
    return {
      onboardingCompleted: user?.onboarding_completed ?? false,
      assignedProvinces: user?.assigned_provinces || null,
    };
  },
  ["qcto-user-data"],
  { revalidate: 5 }
);

export default async function QCTOLayout({
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

  // Get View As User info early to check permissions
  const viewAsInfo = await getViewAsUserInfo(
    session.user.userId,
    session.user.role,
    userName
  );

  // Use viewing as user's context if present, otherwise use actual user's context
  const displayRole = viewAsInfo?.viewingAsRole || role;

  // Allow access if original role can access qcto OR viewing-as role can access qcto
  const originalCanAccess = canAccessArea(role, "qcto") || role === "PLATFORM_ADMIN";
  const viewingAsCanAccess = displayRole ? (canAccessArea(displayRole, "qcto") || displayRole === "PLATFORM_ADMIN") : false;

  if (!originalCanAccess && !viewingAsCanAccess) {
    redirect("/unauthorized");
  }
  const displayUserName = viewAsInfo?.viewingAsUserName || userName;

  // Get onboarding status and assigned provinces for client-side guard and navigation
  // We'll handle redirects on the client side to prevent server-side redirect loops
  let onboardingCompleted = true;
  let assignedProvinces: string[] | null = null;

  // Determine which user's data to fetch (viewing as or actual user)
  const userIdToFetch = viewAsInfo?.viewingAsUserId || session.user.userId;
  const roleToFetch = viewAsInfo?.viewingAsRole || role;

  if (roleToFetch !== "QCTO_SUPER_ADMIN" && roleToFetch !== "PLATFORM_ADMIN") {
    // Use cached version to avoid repeated database queries
    const userData = await getCachedUserData(userIdToFetch);
    onboardingCompleted = userData.onboardingCompleted;
    assignedProvinces = userData.assignedProvinces;
  }

  // Get navigation items based on viewing-as role (if viewing as someone) or original role
  // This ensures sidebar links match the viewing-as user's role
  // Pass assigned provinces to filter sidebar province options
  const baseNavItems = viewAsInfo?.viewingAsRole
    ? getNavigationItemsForRole(viewAsInfo.viewingAsRole, assignedProvinces)
    : getQctoNavItems(displayRole, assignedProvinces);

  const navigationItems = filterNavItems(displayRole, baseNavItems);

  // Fetch user image for consistency across app
  const user = await prisma.user.findUnique({
    where: { user_id: session.user.userId },
    select: { image: true },
  });
  const userImage = user?.image || null;

  return (
    <>
      <OnboardingGuard onboardingCompleted={onboardingCompleted} userRole={role} />
      <AppShell
        navigationItems={navigationItems}
        currentUserRole={displayRole}
        userName={displayUserName}
        userId={viewAsInfo?.viewingAsUserId || session.user.userId}
        userImage={userImage}
        viewingAsUserId={viewAsInfo?.viewingAsUserId ?? null}
        viewingAsRole={viewAsInfo?.viewingAsRole ?? null}
        viewingAsUserName={viewAsInfo?.viewingAsUserName ?? null}
        originalUserName={viewAsInfo?.originalUserName}
        originalRole={viewAsInfo?.originalRole}
      >
        {children}
      </AppShell>
    </>
  );
}

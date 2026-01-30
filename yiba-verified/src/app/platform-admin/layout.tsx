import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { filterNavItems } from "@/components/layout/nav";
import { getPlatformAdminNavItems, getNavigationItemsForRole } from "@/lib/navigation";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getViewAsUserInfo } from "@/lib/viewAsUserServer";
import { unstable_cache } from "next/cache";

// Cache session fetching per request
const getCachedSession = cache(async () => {
  return getServerSession(authOptions);
});

// Cache onboarding check by email (matches API which updates user by email)
const getCachedOnboardingStatus = unstable_cache(
  async (email: string) => {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        onboarding_completed: true,
      },
    });
    return user?.onboarding_completed ?? false;
  },
  ["onboarding-status"],
  { revalidate: 5, tags: ["onboarding-status"] }
);

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  
  // Get View As User info early to check permissions
  const userName = session.user.name || "User";
  const viewAsInfo = await getViewAsUserInfo(
    session.user.userId,
    session.user.role,
    userName
  );
  
  // Use viewing as user's context if present, otherwise use actual user's context
  const displayRole = viewAsInfo?.viewingAsRole || role;
  const displayUserName = viewAsInfo?.viewingAsUserName || userName;
  
  // Allow access if original role is PLATFORM_ADMIN OR viewing as PLATFORM_ADMIN
  if (role !== "PLATFORM_ADMIN" && displayRole !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Get navigation items based on viewing-as role (if viewing as someone) or original role
  // This ensures sidebar links match the viewing-as user's role
  // Badge counts are now loaded client-side to avoid blocking page render
  const baseNavItems = viewAsInfo?.viewingAsRole
    ? getNavigationItemsForRole(viewAsInfo.viewingAsRole)
    : getPlatformAdminNavItems();
  
  const filtered = filterNavItems(displayRole, baseNavItems);
  const navigationItems = filtered;

  // Check onboarding status by email (same as API so we see the updated value)
  const email = session.user.email;
  const onboardingCompleted = email
    ? await getCachedOnboardingStatus(email)
    : false;

  // Redirect to onboarding if not completed (only for original user).
  // Skip redirect when already on onboarding path to avoid redirect loop.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  if (!viewAsInfo?.viewingAsRole && !onboardingCompleted && !pathname.startsWith("/platform-admin/onboarding")) {
    redirect("/platform-admin/onboarding");
  }

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

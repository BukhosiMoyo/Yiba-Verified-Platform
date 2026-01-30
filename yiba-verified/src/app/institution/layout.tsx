import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { filterNavItems } from "@/components/layout/nav";
import { getInstitutionNavItems, getNavigationItemsForRole } from "@/lib/navigation";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";
import { getViewAsUserInfo } from "@/lib/viewAsUserServer";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getCurrentInstitutionForUser } from "@/lib/currentInstitution";
import type { InstitutionDisplay } from "@/lib/currentInstitution";
import { InstitutionOnboardingLayoutWrapper } from "@/components/institution/onboarding/InstitutionOnboardingLayoutWrapper";

// Cache session fetching per request
const getCachedSession = cache(async () => {
  return getServerSession(authOptions);
});

// Cache onboarding check per user (5 second cache); tag allows revalidateTag from API
const getCachedOnboardingStatus = unstable_cache(
  async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        onboarding_completed: true,
      },
    });
    return user?.onboarding_completed ?? false;
  },
  ["onboarding-status"],
  { revalidate: 5, tags: ["onboarding-status"] }
);

export default async function InstitutionLayout({
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
  
  // Allow access if original role can access institution OR viewing-as role can access institution
  const originalCanAccess = role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF" || role === "PLATFORM_ADMIN";
  const viewingAsCanAccess = displayRole === "INSTITUTION_ADMIN" || displayRole === "INSTITUTION_STAFF" || displayRole === "PLATFORM_ADMIN";
  
  if (!originalCanAccess && !viewingAsCanAccess) {
    redirect("/unauthorized");
  }
  const displayUserName = viewAsInfo?.viewingAsUserName || userName;

  // Multi-institution: resolve institutions and current ID for institution layout (only for actual user, not when viewing as)
  let institutions: InstitutionDisplay[] = [];
  let currentInstitutionId: string | null = null;
  if (!viewAsInfo?.viewingAsRole && (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF")) {
    const cookieStore = await cookies();
    const preferredId = cookieStore.get("current_institution_id")?.value ?? null;
    const resolved = await getCurrentInstitutionForUser(session.user.userId, preferredId);
    institutions = resolved.institutions;
    currentInstitutionId = resolved.currentInstitutionId;
  }

  // Get navigation items based on viewing-as role (if viewing as someone) or original role
  // This ensures sidebar links match the viewing-as user's role
  const baseNavItems = viewAsInfo?.viewingAsRole
    ? getNavigationItemsForRole(viewAsInfo.viewingAsRole)
    : getInstitutionNavItems();
  
  const navigationItems = filterNavItems(displayRole, baseNavItems);

  // Check onboarding status for INSTITUTION_ADMIN
  // Only check original user, not viewing-as user
  // Use cached version to avoid repeated database queries
  // Skip redirect when already on onboarding path to avoid redirect loop
  if (!viewAsInfo?.viewingAsRole && role === "INSTITUTION_ADMIN") {
    const onboardingCompleted = await getCachedOnboardingStatus(session.user.userId);
    if (!onboardingCompleted) {
      const pathname = (await headers()).get("x-pathname") ?? "";
      if (!pathname.startsWith("/institution/onboarding")) {
        redirect("/institution/onboarding");
      }
    }
  }

  return (
    <InstitutionOnboardingLayoutWrapper
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
          institutions={institutions}
          currentInstitutionId={currentInstitutionId}
        >
          {children}
        </AppShell>
      }
    >
      {children}
    </InstitutionOnboardingLayoutWrapper>
  );
}

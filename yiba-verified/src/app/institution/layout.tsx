import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import { filterNavItems } from "@/components/layout/nav";
import { getInstitutionNavItems } from "@/lib/navigation";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";
import { getViewAsUserInfo } from "@/lib/viewAsUserServer";
import { prisma } from "@/lib/prisma";

export default async function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  // Allow INSTITUTION_* roles and PLATFORM_ADMIN (app owners - they see everything! 🦸)
  if (role !== "INSTITUTION_ADMIN" && role !== "INSTITUTION_STAFF" && role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  const navigationItems = filterNavItems(role, getInstitutionNavItems());
  const userName = session.user.name || "User";

  // Check onboarding status for INSTITUTION_ADMIN
  if (role === "INSTITUTION_ADMIN") {
    const user = await prisma.user.findUnique({
      where: { user_id: session.user.userId },
      select: {
        onboarding_completed: true,
      },
    });

    // Redirect to onboarding if not completed
    if (!user?.onboarding_completed) {
      redirect("/institution/onboarding");
    }
  }

  // Get View As User info if applicable
  const viewAsInfo = await getViewAsUserInfo(
    session.user.userId,
    session.user.role,
    userName
  );

  // Use viewing as user's context if present, otherwise use actual user's context
  const displayRole = viewAsInfo?.viewingAsRole || role;
  const displayUserName = viewAsInfo?.viewingAsUserName || userName;

  return (
    <AppShell
      navigationItems={navigationItems}
      currentUserRole={displayRole}
      userName={displayUserName}
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

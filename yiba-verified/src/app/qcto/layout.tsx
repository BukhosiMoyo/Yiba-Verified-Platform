import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import { filterNavItems } from "@/components/layout/nav";
import { getQctoNavItems } from "@/lib/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessArea } from "@/lib/rbac";
import { getViewAsUserInfo } from "@/lib/viewAsUserServer";
import { prisma } from "@/lib/prisma";

export default async function QCTOLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  // Allow QCTO_* roles and PLATFORM_ADMIN
  if (!canAccessArea(role, "qcto") && role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  const navigationItems = filterNavItems(role, getQctoNavItems());
  const userName = session.user.name || "User";

  // Check onboarding status for QCTO roles (except QCTO_SUPER_ADMIN who can skip)
  if (role !== "QCTO_SUPER_ADMIN" && role !== "PLATFORM_ADMIN") {
    const user = await prisma.user.findUnique({
      where: { user_id: session.user.userId },
      select: {
        onboarding_completed: true,
        default_province: true,
      },
    });

    // Redirect to onboarding if not completed
    if (!user?.onboarding_completed) {
      redirect("/qcto/onboarding");
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

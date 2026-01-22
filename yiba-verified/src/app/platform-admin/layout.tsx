import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import { filterNavItems } from "@/components/layout/nav";
import { getPlatformAdminNavItems } from "@/lib/navigation";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getViewAsUserInfo } from "@/lib/viewAsUserServer";

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  const now = new Date();
  let pendingInvitesCount = 0;
  let activeAnnouncementsCount = 0;
  try {
    [pendingInvitesCount, activeAnnouncementsCount] = await Promise.all([
      prisma.invite.count({
        where: {
          deleted_at: null,
          status: { in: ["QUEUED", "SENDING", "SENT"] },
          expires_at: { gt: now },
        },
      }),
      prisma.announcement.count({
        where: {
          status: "ACTIVE",
          deleted_at: null,
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
        },
      }),
    ]);
  } catch (error) {
    console.error("Error fetching badge counts:", error);
  }

  const filtered = filterNavItems(role, getPlatformAdminNavItems());
  const navigationItems = filtered.map((item) => {
    if (item.href === "/platform-admin/invites") return { ...item, badge: pendingInvitesCount };
    if (item.href === "/platform-admin/announcements") return { ...item, badge: activeAnnouncementsCount };
    return item;
  });
  const userName = session.user.name || "User";

  // Check onboarding status
  const user = await prisma.user.findUnique({
    where: { user_id: session.user.userId },
    select: {
      onboarding_completed: true,
    },
  });

  // Redirect to onboarding if not completed
  if (!user?.onboarding_completed) {
    redirect("/platform-admin/onboarding");
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

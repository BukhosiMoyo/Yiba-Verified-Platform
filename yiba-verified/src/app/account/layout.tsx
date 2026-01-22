import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import { AccountLayout } from "@/components/account/AccountLayout";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";
import { filterNavItems, type NavItem } from "@/components/layout/nav";
import { getNavigationItemsForRole } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";

export default async function AccountLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const userName = session.user.name || "User";
  const userEmail = session.user.email;

  // Fetch badge counts for platform-admin role (invites, learners, active announcements)
  const now = new Date();
  let pendingInvitesCount = 0;
  let learnersCount = 0;
  let activeAnnouncementsCount = 0;

  if (role === "PLATFORM_ADMIN") {
    try {
      [pendingInvitesCount, learnersCount, activeAnnouncementsCount] = await Promise.all([
        prisma.invite.count({
          where: {
            deleted_at: null,
            status: { in: ["QUEUED", "SENDING", "SENT"] },
            expires_at: { gt: now },
          },
        }),
        prisma.learner.count({ where: { deleted_at: null } }),
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
  }

  const allNavigationItems = getNavigationItemsForRole(role);
  const filtered = filterNavItems(role, allNavigationItems);

  // Apply badge counts for platform-admin
  const navigationItems = filtered.map((item) => {
    const next = { ...item };
    if (role === "PLATFORM_ADMIN") {
      if (item.href === "/platform-admin/invites") next.badge = pendingInvitesCount;
      else if (item.href === "/platform-admin/learners") next.badge = learnersCount;
      else if (item.href === "/platform-admin/announcements") next.badge = activeAnnouncementsCount;
    }
    return next;
  });

  return (
    <AppShell
      navigationItems={navigationItems}
      currentUserRole={role}
      userName={userName}
    >
      <AccountLayout
        currentUserRole={role}
        userName={userName}
        userEmail={userEmail}
      >
        {children}
      </AccountLayout>
    </AppShell>
  );
}
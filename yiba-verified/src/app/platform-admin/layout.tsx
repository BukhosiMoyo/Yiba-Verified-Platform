import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import { filterNavItems, type NavItem } from "@/components/layout/nav";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

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

  let pendingInvitesCount = 0;
  try {
    pendingInvitesCount = await prisma.invite.count({
      where: {
        deleted_at: null,
        status: { in: ["QUEUED", "SENDING", "SENT"] },
        expires_at: { gt: new Date() },
      },
    });
  } catch (error) {
    console.error("Error fetching badge counts:", error);
  }

  const allNavigationItems: NavItem[] = [
    { label: "Dashboard", href: "/platform-admin", iconKey: "layout-dashboard" },
    { label: "Institutions", href: "/platform-admin/institutions", iconKey: "building-2" },
    { label: "Learners", href: "/platform-admin/learners", iconKey: "users" },
    { label: "Qualifications", href: "/platform-admin/qualifications", iconKey: "graduation-cap" },
    { label: "Users", href: "/platform-admin/users", iconKey: "users", capability: "STAFF_INVITE" },
    { label: "Invites", href: "/platform-admin/invites", iconKey: "mail", badge: pendingInvitesCount },
    { label: "Announcements", href: "/platform-admin/announcements", iconKey: "bell" },
    { label: "Audit Logs", href: "/platform-admin/audit-logs", iconKey: "file-text", capability: "AUDIT_VIEW" },
    { label: "Reports", href: "/platform-admin/reports", iconKey: "chart-column", capability: "REPORTS_VIEW" },
    { label: "System Health", href: "/platform-admin/system-health", iconKey: "activity" },
  ];

  const navigationItems = filterNavItems(role, allNavigationItems);
  const userName = session.user.name || "User";

  return (
    <AppShell
      navigationItems={navigationItems}
      currentUserRole={role}
      userName={userName}
    >
      {children}
    </AppShell>
  );
}

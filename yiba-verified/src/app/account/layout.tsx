import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import { AccountLayout } from "@/components/account/AccountLayout";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";
import { filterNavItems, type NavItem } from "@/components/layout/nav";
import { prisma } from "@/lib/prisma";

/**
 * Get navigation items based on user role.
 * Account pages show the main sidebar navigation; AccountLayout provides account-specific nav inside content.
 */
function getNavigationItemsForRole(role: Role): NavItem[] {
  switch (role) {
    case "PLATFORM_ADMIN":
      return [
        { label: "Dashboard", href: "/platform-admin", iconKey: "layout-dashboard" },
        { label: "Institutions", href: "/platform-admin/institutions", iconKey: "building-2" },
        { label: "Learners", href: "/platform-admin/learners", iconKey: "users" },
        { label: "Qualifications", href: "/platform-admin/qualifications", iconKey: "graduation-cap" },
        { label: "Users", href: "/platform-admin/users", iconKey: "users", capability: "STAFF_INVITE" },
        { label: "Invites", href: "/platform-admin/invites", iconKey: "mail" },
        { label: "Announcements", href: "/platform-admin/announcements", iconKey: "bell" },
        { label: "Audit Logs", href: "/platform-admin/audit-logs", iconKey: "file-text", capability: "AUDIT_VIEW" },
        { label: "Reports", href: "/platform-admin/reports", iconKey: "chart-column", capability: "REPORTS_VIEW" },
        { label: "System Health", href: "/platform-admin/system-health", iconKey: "activity" },
      ];
    case "INSTITUTION_ADMIN":
    case "INSTITUTION_STAFF":
      return [
        { label: "Dashboard", href: "/institution", iconKey: "layout-dashboard" },
        { label: "Institution Profile", href: "/institution/profile", iconKey: "building-2", capability: "INSTITUTION_PROFILE_EDIT" },
        { label: "Staff", href: "/institution/staff", iconKey: "users", capability: "STAFF_INVITE" },
        { label: "Invites", href: "/institution/invites", iconKey: "mail", capability: "STAFF_INVITE" },
        { label: "Learners", href: "/institution/learners", iconKey: "graduation-cap", capability: "LEARNER_VIEW" },
        { label: "Enrolments", href: "/institution/enrolments", iconKey: "clipboard-list", capability: "LEARNER_VIEW" },
        { label: "Submissions", href: "/institution/submissions", iconKey: "upload", capability: "LEARNER_VIEW" },
        { label: "QCTO Requests", href: "/institution/requests", iconKey: "file-question", capability: "LEARNER_VIEW" },
        { label: "Readiness (Form 5)", href: "/institution/readiness", iconKey: "file-text", capability: "FORM5_VIEW" },
        { label: "Evidence Vault", href: "/institution/documents", iconKey: "folder-open", capability: "EVIDENCE_VIEW" },
        { label: "Reports", href: "/institution/reports", iconKey: "chart-column", capability: "REPORTS_VIEW" },
      ];
    case "QCTO_USER":
      return [
        { label: "Dashboard", href: "/qcto", iconKey: "layout-dashboard" },
        { label: "Readiness", href: "/qcto/readiness", iconKey: "file-text" },
        { label: "Submissions", href: "/qcto/submissions", iconKey: "upload" },
        { label: "Requests", href: "/qcto/requests", iconKey: "file-question" },
      ];
    case "STUDENT":
      return [
        { label: "Dashboard", href: "/student", iconKey: "layout-dashboard" },
      ];
    default:
      return [];
  }
}

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

  // Fetch badge counts for platform-admin role (invites and learners)
  let pendingInvitesCount = 0;
  let learnersCount = 0;

  if (role === "PLATFORM_ADMIN") {
    try {
      [pendingInvitesCount, learnersCount] = await Promise.all([
        // Pending invites: QUEUED, SENDING, SENT status and not expired
        prisma.invite.count({
          where: {
            deleted_at: null,
            status: { in: ["QUEUED", "SENDING", "SENT"] },
            expires_at: { gt: new Date() },
          },
        }),
        // Total learners count
        prisma.learner.count({
          where: { deleted_at: null },
        }),
      ]);
    } catch (error) {
      // If there's an error, just use 0 counts
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
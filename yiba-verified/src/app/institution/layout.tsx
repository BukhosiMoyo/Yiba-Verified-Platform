import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import type { NavItem } from "@/components/layout/nav";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";

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
  // QCTO_USER has their own routes (/qcto) - they only see review-related stuff, not institution management
  // IMPORTANT: PLATFORM_ADMIN needs full visibility everywhere - they're the app owners who fix everything!
  // They get all the analytics and see data about everyone because... well, they own the app!
  // All pages in /institution/* should show ALL data (no institution scoping) for PLATFORM_ADMIN
  // Other users (Institutions, Students, QCTO) are limited to the work they do - that's how it should be!
  if (role !== "INSTITUTION_ADMIN" && role !== "INSTITUTION_STAFF" && role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  const navigationItems: NavItem[] = [
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

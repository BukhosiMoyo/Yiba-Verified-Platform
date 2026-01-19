import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import type { NavItem } from "@/components/layout/nav";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";

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
  // Allow QCTO_USER and PLATFORM_ADMIN (app owners see everything! 🦸)
  if (role !== "QCTO_USER" && role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  const navigationItems: NavItem[] = [
    { label: "Dashboard", href: "/qcto", iconKey: "layout-dashboard" },
    {
      label: "Submissions",
      href: "/qcto/submissions",
      iconKey: "upload",
      children: [
        { label: "All", href: "/qcto/submissions" },
        { label: "Pending", href: "/qcto/submissions?status=SUBMITTED" },
        { label: "Under review", href: "/qcto/submissions?status=UNDER_REVIEW" },
        { label: "Approved", href: "/qcto/submissions?status=APPROVED" },
        { label: "Rejected", href: "/qcto/submissions?status=REJECTED" },
      ],
    },
    {
      label: "Requests",
      href: "/qcto/requests",
      iconKey: "file-question",
      children: [
        { label: "All", href: "/qcto/requests" },
        { label: "Pending", href: "/qcto/requests?status=PENDING" },
        { label: "Approved", href: "/qcto/requests?status=APPROVED" },
        { label: "Rejected", href: "/qcto/requests?status=REJECTED" },
      ],
    },
    { label: "Institutions", href: "/qcto/institutions", iconKey: "building-2" },
    {
      label: "Readiness Reviews",
      href: "/qcto/readiness",
      iconKey: "eye",
      capability: "FORM5_VIEW",
      children: [
        { label: "All", href: "/qcto/readiness" },
        { label: "Pending", href: "/qcto/readiness?status=SUBMITTED" },
        { label: "Under review", href: "/qcto/readiness?status=UNDER_REVIEW" },
        { label: "Recommended", href: "/qcto/readiness?status=RECOMMENDED" },
        { label: "Rejected", href: "/qcto/readiness?status=REJECTED" },
      ],
    },
    { label: "Evidence Flags", href: "/qcto/evidence-flags", iconKey: "flag", capability: "EVIDENCE_VIEW" },
    { label: "Audit Logs", href: "/qcto/audit-logs", iconKey: "file-text", capability: "AUDIT_VIEW" },
    { label: "Reports", href: "/qcto/reports", iconKey: "chart-column", capability: "REPORTS_VIEW" },
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

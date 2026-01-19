import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import type { NavItem } from "@/components/layout/nav";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/lib/rbac";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "STUDENT") {
    redirect("/unauthorized");
  }

  const navigationItems: NavItem[] = [
    { label: "Dashboard", href: "/student", iconKey: "layout-dashboard" },
    { label: "My Profile", href: "/student/profile", iconKey: "users", capability: "LEARNER_VIEW" },
    { label: "My Enrolments", href: "/student/enrolments", iconKey: "clipboard-list", capability: "LEARNER_VIEW" },
    { label: "Attendance", href: "/student/attendance", iconKey: "activity", capability: "ATTENDANCE_VIEW" },
    { label: "Certificates", href: "/student/certificates", iconKey: "award", capability: "LEARNER_VIEW" },
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

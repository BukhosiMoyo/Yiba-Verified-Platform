import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import { authOptions } from "@/lib/auth";
import { filterNavItems } from "@/components/layout/nav";
import { getNavigationItemsForRole } from "@/lib/navigation";

/**
 * Layout for /announcements — view-only announcements for all authenticated roles.
 * Uses same AppShell and role-based nav as account/dashboard.
 */
export default async function AnnouncementsLayout({
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
  const allNavigationItems = getNavigationItemsForRole(role);
  const navigationItems = filterNavItems(role, allNavigationItems);

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

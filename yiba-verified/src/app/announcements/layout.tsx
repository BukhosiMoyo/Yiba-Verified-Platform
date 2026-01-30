import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/layout/AppShell";
import { authOptions } from "@/lib/auth";
import { filterNavItems } from "@/components/layout/nav";
import { getNavigationItemsForRole } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";

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
  
  // Fetch assigned provinces for QCTO users (except QCTO_SUPER_ADMIN and PLATFORM_ADMIN)
  let assignedProvinces: string[] | null = null;
  if (
    role !== "PLATFORM_ADMIN" &&
    role !== "QCTO_SUPER_ADMIN" &&
    (role === "QCTO_USER" ||
      role === "QCTO_ADMIN" ||
      role === "QCTO_REVIEWER" ||
      role === "QCTO_AUDITOR" ||
      role === "QCTO_VIEWER")
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { user_id: session.user.userId },
        select: { assigned_provinces: true },
      });
      assignedProvinces = user?.assigned_provinces || null;
    } catch (error) {
      console.error("Error fetching assigned provinces:", error);
    }
  }
  
  const allNavigationItems = getNavigationItemsForRole(role, assignedProvinces);
  const navigationItems = filterNavItems(role, allNavigationItems);

  return (
    <AppShell
      navigationItems={navigationItems}
      currentUserRole={role}
      userName={userName}
      userId={session.user.userId}
    >
      {children}
    </AppShell>
  );
}

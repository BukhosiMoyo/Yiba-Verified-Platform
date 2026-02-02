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
  // const userImage = session.user.image; // Removed due to type error
  let userImageFromDb: string | null = null;

  // Fetch user's verification level
  type VerificationLevel = "NONE" | "BLUE" | "GREEN" | "GOLD" | "BLACK";
  let verificationLevel: VerificationLevel = "NONE";
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: session.user.userId },
      select: { verification_level: true, image: true },
    });
    verificationLevel = (user?.verification_level as VerificationLevel) || "NONE";
    // userImage is strictly typed in the component, so we default to null if undefined
  } catch (error) {
    console.error("Error fetching verification level:", error);
  }

  // Use DB image if available, else fall back to session if we fixed the type, but for now just DB.
  // We need to re-declare userImage since 'const' block scope issues if we just defined it inside try/catch.
  // Better approach: initialize outside.

  // Fetch badge counts for platform-admin role (invites, active announcements)
  const now = new Date();
  let pendingInvitesCount = 0;
  let activeAnnouncementsCount = 0;
  let assignedProvinces: string[] | null = null;

  // Fetch assigned provinces for QCTO users (except QCTO_SUPER_ADMIN and PLATFORM_ADMIN)
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

  if (role === "PLATFORM_ADMIN") {
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
  }

  const allNavigationItems = getNavigationItemsForRole(role, assignedProvinces);
  const filtered = filterNavItems(role, allNavigationItems);

  // Apply badge counts for platform-admin
  const navigationItems = filtered.map((item) => {
    const next = { ...item };
    if (role === "PLATFORM_ADMIN") {
      if (item.href === "/platform-admin/invites") next.badge = pendingInvitesCount;
      else if (item.href === "/platform-admin/announcements") next.badge = activeAnnouncementsCount;
    }
    return next;
  });

  return (
    <AppShell
      navigationItems={navigationItems}
      currentUserRole={role}
      userName={userName}
      userId={session.user.userId}
    >
      <AccountLayout
        currentUserRole={role}
        userName={userName}
        userEmail={userEmail}
        userImage={userImageFromDb}
        verificationLevel={verificationLevel}
      >
        {children}
      </AccountLayout>
    </AppShell>
  );
}
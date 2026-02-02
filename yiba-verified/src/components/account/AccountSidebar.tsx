"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Shield,
  FileText,
  Bell,
  Settings,
  Building2,
  GraduationCap,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/rbac";
import { AvatarBadgeOverlay, VerificationPill } from "@/components/shared/VerificationBadge";
import type { VerificationLevel } from "@/lib/verification";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type AccountSidebarProps = {
  userName: string;
  userRole: Role;
  userEmail?: string;
  userImage?: string | null;
  verificationLevel?: VerificationLevel;
};

const roleLabels: Record<Role, string> = {
  PLATFORM_ADMIN: "Platform Admin",
  QCTO_USER: "QCTO",
  QCTO_SUPER_ADMIN: "QCTO Super Admin",
  QCTO_ADMIN: "QCTO Admin",
  QCTO_REVIEWER: "QCTO Reviewer",
  QCTO_AUDITOR: "QCTO Auditor",
  QCTO_VIEWER: "QCTO Viewer",
  INSTITUTION_ADMIN: "Institution Admin",
  INSTITUTION_STAFF: "Institution Staff",
  STUDENT: "Learner",
  ADVISOR: "Advisor",
};

// Helper to get user initials for avatar
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function AccountSidebar({
  userName,
  userRole,
  userEmail,
  userImage,
  verificationLevel = "NONE",
}: AccountSidebarProps) {
  const pathname = usePathname();

  // Base navigation items available to all roles
  const baseNavItems: NavItem[] = [
    { href: "/account/profile", label: "Profile", icon: User },
    { href: "/account/security", label: "Security", icon: Shield },
    { href: "/account/logs", label: "Logs", icon: FileText },
    { href: "/account/notifications", label: "Notifications", icon: Bell },
  ];

  // Role-based additional items
  const roleBasedItems: NavItem[] = [];
  if (userRole === "PLATFORM_ADMIN") {
    roleBasedItems.push({
      href: "/account/admin-preferences",
      label: "Admin Preferences",
      icon: Settings,
    });
  } else if (userRole === "INSTITUTION_ADMIN" || userRole === "INSTITUTION_STAFF") {
    roleBasedItems.push({
      href: "/account/organisation",
      label: "Organisation",
      icon: Building2,
    });
  } else if (userRole === "STUDENT") {
    roleBasedItems.push({
      href: "/account/academic-profile",
      label: "Academic Profile",
      icon: GraduationCap,
    });
  } else if (userRole === "QCTO_USER") {
    roleBasedItems.push({
      href: "/account/scope-assignments",
      label: "Scope / Assignments",
      icon: Briefcase,
    });
  }

  const allNavItems = [...baseNavItems, ...roleBasedItems];

  const isActive = (href: string): boolean => {
    if (pathname === href) {
      return true;
    }
    // Check if this is a root section (has children)
    const isRootSection = allNavItems.some(
      (item) => item.href !== href && item.href.startsWith(href + "/")
    );
    if (isRootSection) {
      return false;
    }
    return pathname.startsWith(href + "/");
  };

  return (
    <div className="flex h-full flex-col bg-card border border-border rounded-2xl shadow-sm dark:shadow-none">
      {/* User Info Section */}
      <div className="p-6 border-b border-border/60">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-sm overflow-hidden border-2 border-white dark:border-gray-800">
              {userImage ? (
                <img src={userImage} alt={userName} className="h-full w-full object-cover" />
              ) : (
                getInitials(userName)
              )}
            </div>
            <AvatarBadgeOverlay level={verificationLevel} size="md" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground truncate flex-1 min-w-0">
                {userName}
              </p>
              <VerificationPill level={verificationLevel} showIcon={false} />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {roleLabels[userRole]}
            </p>
            {userEmail && (
              <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                {userEmail}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {allNavItems
          .filter((item) => item && item.href) // Safety: filter out items without href
          .map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href || "#"} // Fallback to prevent undefined
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                  active
                    ? "bg-blue-500/15 dark:bg-blue-500/20 border border-blue-500/25 dark:border-blue-500/30 text-blue-900 dark:text-white shadow-[0_1px_0_rgba(0,0,0,0.03)] dark:shadow-none"
                    : "text-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600 dark:bg-blue-400 transition-all duration-200 ease-out" />
                )}

                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ease-out flex-shrink-0",
                    active
                      ? "bg-blue-500/20 dark:bg-blue-500/25"
                      : "bg-muted group-hover:bg-muted/80"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors duration-200 ease-out",
                      active ? "text-blue-900 dark:text-white" : "text-muted-foreground group-hover:text-foreground"
                    )}
                    strokeWidth={1.5}
                  />
                </div>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
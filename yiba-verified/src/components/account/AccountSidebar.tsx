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

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type AccountSidebarProps = {
  userName: string;
  userRole: Role;
  userEmail?: string;
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
    <div className="flex h-full flex-col bg-gray-50/50 border-r border-gray-100 rounded-r-2xl">
      {/* User Info Section */}
      <div className="p-6 border-b border-gray-100/60">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-sm">
            {getInitials(userName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {roleLabels[userRole]}
            </p>
            {userEmail && (
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {userEmail}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {allNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                active
                  ? "bg-blue-50/60 border border-blue-100/60 text-blue-700 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                  : "text-gray-700 hover:bg-gray-100/60 hover:text-gray-900"
              )}
            >
              {/* Active indicator bar */}
              {active && (
                <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-600 transition-all duration-200 ease-out" />
              )}

              <Icon
                className={cn(
                  "h-5 w-5 transition-colors duration-200 ease-out flex-shrink-0",
                  active ? "text-blue-700" : "text-gray-500 group-hover:text-gray-700"
                )}
                strokeWidth={1.5}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
import type { Role } from "@/lib/rbac";
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

export type AccountNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[]; // If specified, only show for these roles. If undefined, show for all.
};

/**
 * Get account navigation items based on user role
 * Returns a filtered list of navigation items appropriate for the given role
 */
export function getAccountNavItems(role: Role): AccountNavItem[] {
  const allItems: AccountNavItem[] = [
    // Default items for all roles
    { label: "Profile", href: "/account/profile", icon: User },
    { label: "Security", href: "/account/security", icon: Shield },
    { label: "Logs", href: "/account/logs", icon: FileText },
    { label: "Notifications", href: "/account/notifications", icon: Bell },
    
    // Role-specific items
    {
      label: "Admin Preferences",
      href: "/account/admin-preferences",
      icon: Settings,
      roles: ["PLATFORM_ADMIN"],
    },
    {
      label: "Organisation",
      href: "/account/organisation",
      icon: Building2,
      roles: ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"],
    },
    {
      label: "Academic Profile",
      href: "/account/academic-profile",
      icon: GraduationCap,
      roles: ["STUDENT"],
    },
    {
      label: "Scope / Assignments",
      href: "/account/scope-assignments",
      icon: Briefcase,
      roles: ["QCTO_USER", "QCTO_SUPER_ADMIN", "QCTO_ADMIN", "QCTO_REVIEWER", "QCTO_AUDITOR", "QCTO_VIEWER"],
    },
  ];

  // Filter items based on role
  return allItems.filter((item) => {
    if (!item.roles) {
      return true; // Show for all roles
    }
    return item.roles.includes(role);
  });
}
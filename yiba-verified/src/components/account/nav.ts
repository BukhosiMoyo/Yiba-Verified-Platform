
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
import type { Role } from "@/lib/rbac";

export type AccountNavItem = {
    href: string;
    label: string;
    icon: LucideIcon;
};

export const roleLabels: Record<Role, string> = {
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
    FACILITATOR: "Facilitator",
};

export function getAccountNavItems(role: Role): AccountNavItem[] {
    // Base navigation items available to all roles
    const baseNavItems: AccountNavItem[] = [
        { href: "/account/profile", label: "Profile", icon: User },
        { href: "/account/security", label: "Security", icon: Shield },
        { href: "/account/logs", label: "Logs", icon: FileText },
        { href: "/account/notifications", label: "Notifications", icon: Bell },
    ];

    // Role-based additional items
    const roleBasedItems: AccountNavItem[] = [];
    if (role === "PLATFORM_ADMIN") {
        roleBasedItems.push({
            href: "/account/admin-preferences",
            label: "Admin Preferences",
            icon: Settings,
        });
    } else if (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") {
        roleBasedItems.push({
            href: "/account/organisation",
            label: "Organisation",
            icon: Building2,
        });
    } else if (role === "STUDENT") {
        roleBasedItems.push({
            href: "/account/academic-profile",
            label: "Academic Profile",
            icon: GraduationCap,
        });
    } else if (role === "QCTO_USER") {
        roleBasedItems.push({
            href: "/account/scope-assignments",
            label: "Scope / Assignments",
            icon: Briefcase,
        });
    }

    return [...baseNavItems, ...roleBasedItems];
}

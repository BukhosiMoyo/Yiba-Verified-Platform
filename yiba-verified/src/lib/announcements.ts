/**
 * Utility functions for announcements.
 */

/**
 * Formats a UserRole enum value into a human-readable display name.
 */
export function formatRoleForDisplay(role: string): string {
  const roleMap: Record<string, string> = {
    PLATFORM_ADMIN: "Platform Admin",
    QCTO_SUPER_ADMIN: "QCTO Super Admin",
    QCTO_ADMIN: "QCTO Admin",
    QCTO_USER: "QCTO User",
    QCTO_REVIEWER: "QCTO Reviewer",
    QCTO_AUDITOR: "QCTO Auditor",
    QCTO_VIEWER: "QCTO Viewer",
    INSTITUTION_ADMIN: "Institution Admin",
    INSTITUTION_STAFF: "Institution Staff",
    STUDENT: "Student",
  };
  return roleMap[role] || role;
}

/**
 * All available user roles for announcement targeting.
 */
export const ANNOUNCEMENT_TARGET_ROLES = [
  { value: "STUDENT", label: "Students" },
  { value: "INSTITUTION_ADMIN", label: "Institution Admins" },
  { value: "INSTITUTION_STAFF", label: "Institution Staff" },
  { value: "QCTO_USER", label: "QCTO Users" },
  { value: "QCTO_SUPER_ADMIN", label: "QCTO Super Admins" },
  { value: "QCTO_ADMIN", label: "QCTO Admins" },
  { value: "QCTO_REVIEWER", label: "QCTO Reviewers" },
  { value: "QCTO_AUDITOR", label: "QCTO Auditors" },
  { value: "QCTO_VIEWER", label: "QCTO Viewers" },
  { value: "PLATFORM_ADMIN", label: "Platform Admins" },
] as const;

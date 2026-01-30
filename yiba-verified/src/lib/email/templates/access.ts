/**
 * Role-scoped access to email template types.
 * Platform Admin = all invite + auth; Institution Admin = institution/student; QCTO Super Admin = QCTO only.
 */

import type { EmailTemplateType } from "@prisma/client";
import type { Role } from "@/lib/rbac";

const INSTITUTION_INVITE_TYPES: EmailTemplateType[] = [
  "INSTITUTION_ADMIN_INVITE",
  "INSTITUTION_STAFF_INVITE",
  "STUDENT_INVITE",
];

const QCTO_INVITE_TYPES: EmailTemplateType[] = ["QCTO_INVITE"];

const PLATFORM_INVITE_TYPES: EmailTemplateType[] = [
  "PLATFORM_ADMIN_INVITE",
  "SYSTEM_NOTIFICATION",
];

const AUTH_TEMPLATE_TYPES: EmailTemplateType[] = [
  "AUTH_PASSWORD_RESET",
  "AUTH_EMAIL_VERIFY",
];

/** All invite template types (no auth). */
export const ALL_INVITE_TEMPLATE_TYPES: EmailTemplateType[] = [
  ...INSTITUTION_INVITE_TYPES,
  ...QCTO_INVITE_TYPES,
  ...PLATFORM_INVITE_TYPES,
];

/** Template types the given role is allowed to view/edit. */
export function getAllowedTemplateTypesForRole(role: Role): EmailTemplateType[] {
  if (role === "PLATFORM_ADMIN") {
    return [...ALL_INVITE_TEMPLATE_TYPES, ...AUTH_TEMPLATE_TYPES];
  }
  if (role === "INSTITUTION_ADMIN") {
    return INSTITUTION_INVITE_TYPES;
  }
  if (role === "QCTO_SUPER_ADMIN") {
    return QCTO_INVITE_TYPES;
  }
  // Institution staff / others: only templates for roles they can invite (if any)
  return INSTITUTION_INVITE_TYPES;
}

/** Whether the role can access (view/edit) the given template type. */
export function canAccessTemplateType(
  role: Role,
  templateType: EmailTemplateType
): boolean {
  return getAllowedTemplateTypesForRole(role).includes(templateType);
}

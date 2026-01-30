/**
 * Display metadata for email template types: trigger event and category.
 * Used by Platform Admin Email Templates table and detail views.
 */

import type { EmailTemplateType } from "@prisma/client";

export type TemplateCategory = "Invite" | "Notification" | "Status" | "System" | "Auth";

export const TRIGGER_EVENT_BY_TYPE: Record<EmailTemplateType, string> = {
  INSTITUTION_ADMIN_INVITE: "When institution admin is invited",
  INSTITUTION_STAFF_INVITE: "When institution staff is invited",
  STUDENT_INVITE: "When student is invited",
  QCTO_INVITE: "When QCTO user is invited",
  PLATFORM_ADMIN_INVITE: "When platform admin is invited",
  SYSTEM_NOTIFICATION: "System and status notifications",
  AUTH_PASSWORD_RESET: "When user requests password reset",
  AUTH_EMAIL_VERIFY: "When user must verify email",
};

export const CATEGORY_BY_TYPE: Record<EmailTemplateType, TemplateCategory> = {
  INSTITUTION_ADMIN_INVITE: "Invite",
  INSTITUTION_STAFF_INVITE: "Invite",
  STUDENT_INVITE: "Invite",
  QCTO_INVITE: "Invite",
  PLATFORM_ADMIN_INVITE: "Invite",
  SYSTEM_NOTIFICATION: "System",
  AUTH_PASSWORD_RESET: "Auth",
  AUTH_EMAIL_VERIFY: "Auth",
};

/** "Used by" description for each template type (where it is used in the system). */
export const USED_BY_BY_TYPE: Record<EmailTemplateType, string> = {
  INSTITUTION_ADMIN_INVITE: "Invites (institution admin)",
  INSTITUTION_STAFF_INVITE: "Invites (institution staff)",
  STUDENT_INVITE: "Invites (student)",
  QCTO_INVITE: "Invites (QCTO)",
  PLATFORM_ADMIN_INVITE: "Invites (platform admin)",
  SYSTEM_NOTIFICATION: "System notifications",
  AUTH_PASSWORD_RESET: "Auth (password reset)",
  AUTH_EMAIL_VERIFY: "Auth (email verification)",
};

/** All template types in display order (for showing full list including "not created yet"). */
export const ALL_TEMPLATE_TYPES: EmailTemplateType[] = [
  "INSTITUTION_ADMIN_INVITE",
  "INSTITUTION_STAFF_INVITE",
  "STUDENT_INVITE",
  "QCTO_INVITE",
  "PLATFORM_ADMIN_INVITE",
  "SYSTEM_NOTIFICATION",
  "AUTH_PASSWORD_RESET",
  "AUTH_EMAIL_VERIFY",
];

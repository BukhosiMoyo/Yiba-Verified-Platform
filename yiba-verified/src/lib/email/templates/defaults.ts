/**
 * Default template content for creating a new email template by type (upsert on first edit).
 */

import type { EmailTemplateType } from "@prisma/client";
import { TRIGGER_EVENT_BY_TYPE } from "./metadata";

function humanName(type: EmailTemplateType): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getDefaultTemplateForType(type: EmailTemplateType): {
  name: string;
  subject: string;
  header_html: string | null;
  body_sections: { type: string; content: string }[];
  cta_text: string;
  footer_html: string;
} {
  const name = humanName(type);
  const trigger = TRIGGER_EVENT_BY_TYPE[type];

  const inviteSubject = "You're invited to {{institution_name}} on Yiba Verified";
  const inviteBody = [
    { type: "paragraph", content: "Hi {{recipient_name}}," },
    { type: "paragraph", content: "{{inviter_name}} has invited you to join Yiba Verified — the QCTO-recognised platform." },
    { type: "paragraph", content: "Click the button below to review your invitation. This link expires on {{expiry_date}}." },
  ];
  const inviteCta = "Review invitation";
  const inviteFooter = "If you didn't expect this invitation, you can safely ignore this email. Questions? support@yibaverified.co.za";

  const authSubject = "Yiba Verified – {{action_url}}";
  const authBody = [
    { type: "paragraph", content: "Hi {{recipient_name}}," },
    { type: "paragraph", content: "Please use the link below to complete your request. This link expires on {{expiry_date}}." },
  ];
  const authCta = "Continue";
  const authFooter = "If you didn't request this, you can safely ignore this email.";

  switch (type) {
    case "INSTITUTION_ADMIN_INVITE":
    case "INSTITUTION_STAFF_INVITE":
      return {
        name: name,
        subject: inviteSubject,
        header_html: null,
        body_sections: [
          { type: "paragraph", content: "Hi {{recipient_name}}," },
          { type: "paragraph", content: "{{inviter_name}} has invited you to manage {{institution_name}} on Yiba Verified." },
          { type: "paragraph", content: "Click the button below to review your invitation. This link expires on {{expiry_date}}." },
        ],
        cta_text: inviteCta,
        footer_html: inviteFooter,
      };
    case "STUDENT_INVITE":
    case "QCTO_INVITE":
    case "PLATFORM_ADMIN_INVITE":
      return {
        name,
        subject: inviteSubject,
        header_html: null,
        body_sections: inviteBody,
        cta_text: inviteCta,
        footer_html: inviteFooter,
      };
    case "SYSTEM_NOTIFICATION":
      return {
        name,
        subject: "Yiba Verified – notification",
        header_html: null,
        body_sections: [
          { type: "paragraph", content: "Hi {{recipient_name}}," },
          { type: "paragraph", content: "Use the link below for more details: {{action_url}}" },
        ],
        cta_text: "View details",
        footer_html: "This is an automated notification from Yiba Verified.",
      };
    case "AUTH_PASSWORD_RESET":
    case "AUTH_EMAIL_VERIFY":
      return {
        name,
        subject: "Yiba Verified – action required",
        header_html: null,
        body_sections: authBody,
        cta_text: authCta,
        footer_html: authFooter,
      };
    default:
      return {
        name,
        subject: `${trigger} – Yiba Verified`,
        header_html: null,
        body_sections: [{ type: "paragraph", content: "Hi {{recipient_name}}," }],
        cta_text: "Continue",
        footer_html: "Questions? support@yibaverified.co.za",
      };
  }
}

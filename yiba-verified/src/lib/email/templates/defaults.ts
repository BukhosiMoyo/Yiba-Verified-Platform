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
        subject: "You’ve been invited to manage an institution on Yiba Verified",
        header_html: null,
        body_sections: [
          { type: "paragraph", content: "Hi {{recipient_name}}," },
          { type: "paragraph", content: "You’ve been invited to join Yiba Verified as an Institution Admin for {{institution_name}}." },
          { type: "paragraph", content: "As an Institution Admin, you’ll be able to:" },
          {
            type: "list", content: JSON.stringify([
              "Manage your institution profile and branches",
              "Upload and track compliance documentation",
              "Submit readiness information for QCTO review",
              "Monitor progress and feedback in one place"
            ])
          },
          { type: "paragraph", content: "You can accept your invitation now, or review what Yiba Verified offers before deciding." },
        ],
        cta_text: "Accept Invitation",
        footer_html: "If you weren’t expecting this invitation, you can safely ignore this email.",
      };
    case "STUDENT_INVITE":
    case "QCTO_INVITE":
    case "PLATFORM_ADMIN_INVITE":
      return {
        name,
        subject: inviteSubject,
        header_html: null,
        body_sections: inviteBody,
        cta_text: "Accept Invitation",
        footer_html: inviteFooter,
      };
    case "WELCOME":
      return {
        name,
        subject: "Welcome to Yiba Verified 🎉",
        header_html: null,
        body_sections: [
          { type: "paragraph", content: "Hi {{recipient_name}}," },
          { type: "paragraph", content: "Welcome to Yiba Verified — you’re officially in." },
          { type: "paragraph", content: "Yiba Verified is designed to help institutions, learners, and regulators manage accreditation, readiness, and verification in one secure platform." },
          { type: "paragraph", content: "Here’s what you can do next:" },
          {
            type: "list", content: JSON.stringify([
              "Complete your profile and institution details",
              "Upload and manage compliance documentation",
              "Track submissions and review progress in real time"
            ])
          },
          { type: "paragraph", content: "We recommend starting with your dashboard so you can familiarise yourself with the platform." },
          { type: "paragraph", content: "If you ever need help, our support team is just an email away." },
        ],
        cta_text: "Go to Dashboard",
        footer_html: "If you didn’t expect this account to be created, please contact support immediately.",
      };
    case "SYSTEM_NOTIFICATION":
    case "NOTIFICATION":
      return {
        name,
        subject: "{{notification_subject}}", // Dynamic subject
        header_html: null,
        body_sections: [
          { type: "paragraph", content: "Hi {{recipient_name}}," },
          { type: "paragraph", content: "{{notification_message}}" },
          { type: "paragraph", content: "To view the full details and take action, open your dashboard." },
        ],
        cta_text: "View Notification",
        footer_html: "You’re receiving this email because it relates to activity on your Yiba Verified account.",
      };
    case "SYSTEM_ALERT":
      return {
        name,
        subject: "Security alert on your Yiba Verified account",
        header_html: null,
        body_sections: [
          { type: "paragraph", content: "Hi {{recipient_name}}," },
          { type: "paragraph", content: "We detected a security-related action on your Yiba Verified account:" },
          { type: "paragraph", content: "{{alert_description}}" },
          { type: "paragraph", content: "Date & Time: {{timestamp}}" },
          { type: "paragraph", content: "Location: {{location}}" },
          { type: "paragraph", content: "If this was you, no further action is needed." },
          { type: "paragraph", content: "If you don’t recognise this activity, we strongly recommend resetting your password immediately and contacting support." },
        ],
        cta_text: "Secure My Account",
        footer_html: "For your protection, we’ll never ask for your password via email.",
      };
    case "AUTH_PASSWORD_RESET":
      // Handled in separate route, but keeping default here just in case
      return {
        name,
        subject: "Reset your Yiba Verified password",
        header_html: null,
        body_sections: [
          { type: "paragraph", content: "Hi {{recipient_name}}," },
          { type: "paragraph", content: "We received a request to reset the password for your Yiba Verified account." },
          { type: "paragraph", content: "Click the button below to choose a new password. For security reasons, this link will expire in {{expiry_minutes}} minutes." },
          { type: "paragraph", content: "If you didn’t request a password reset, you can safely ignore this email — your account will remain secure." },
        ],
        cta_text: "Reset Password",
        footer_html: "For your protection, we’ll never ask for your password via email.",
      };
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

/**
 * Invite email template resolution and HTML building.
 * Maps invite role to EmailTemplateType; builds HTML from template + placeholders; fallback to default.
 */

import type { UserRole } from "@prisma/client";
import type { EmailTemplate } from "@prisma/client";
import { replacePlaceholders, type InviteTemplateContext } from "./placeholders";

/** Map invite.role to EmailTemplateType for loading template. */
export function getTemplateTypeForInviteRole(role: UserRole): string | null {
  switch (role) {
    case "INSTITUTION_ADMIN":
      return "INSTITUTION_ADMIN_INVITE";
    case "INSTITUTION_STAFF":
      return "INSTITUTION_STAFF_INVITE";
    case "STUDENT":
      return "STUDENT_INVITE";
    case "QCTO_USER":
    case "QCTO_SUPER_ADMIN":
    case "QCTO_ADMIN":
    case "QCTO_REVIEWER":
    case "QCTO_AUDITOR":
    case "QCTO_VIEWER":
      return "QCTO_INVITE";
    case "PLATFORM_ADMIN":
      return "PLATFORM_ADMIN_INVITE";
    default:
      return "INSTITUTION_ADMIN_INVITE"; // safe default
  }
}

/** Build HTML body from template body_sections (JSON array of { type, content }) or single string. */
function buildBodyHtml(
  bodySections: EmailTemplate["body_sections"],
  context: InviteTemplateContext
): string {
  if (bodySections == null) {
    return "";
  }
  if (typeof bodySections === "string") {
    return replacePlaceholders(bodySections, context);
  }
  if (Array.isArray(bodySections)) {
    return (bodySections as { type?: string; content?: string }[])
      .map((block) => {
        const content =
          typeof block === "object" && block && "content" in block
            ? String(block.content ?? "")
            : String(block);
        return `<p style="color: #4b5563; font-size: 16px; margin: 16px 0;">${replacePlaceholders(content, context)}</p>`;
      })
      .join("");
  }
  return "";
}

/** Build full HTML email from template + context. Caller must inject tracked link and tracking pixel. */
export function buildInviteEmailFromTemplate(
  template: EmailTemplate,
  context: InviteTemplateContext,
  trackedLink: string,
  trackingPixelUrl: string,
  customMessage?: string | null
): { subject: string; html: string; text: string } {
  const subject = replacePlaceholders(template.subject, context);
  const headerHtml = template.header_html
    ? replacePlaceholders(template.header_html, context)
    : `<div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;"><h1 style="color: white; margin: 0; font-size: 24px;">Yiba Verified</h1><p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">QCTO-recognised platform</p></div>`;
  const bodyHtml = buildBodyHtml(template.body_sections, context);
  const customBlock = customMessage
    ? `<p style="color: #4b5563; font-size: 16px; margin: 16px 0; font-style: italic;">${replacePlaceholders(customMessage, context)}</p>`
    : "";
  const ctaText = template.cta_text || "Review invitation";
  const footerHtml = template.footer_html
    ? replacePlaceholders(template.footer_html, context)
    : "If you didn't expect this invitation, you can safely ignore this email. Questions? support@yibaverified.co.za";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${headerHtml}
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    ${bodyHtml}
    ${customBlock}
    <div style="margin: 30px 0; text-align: center;">
      <a href="${trackedLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">${replacePlaceholders(ctaText, context)}</a>
    </div>
    <p style="color: #9ca3af; font-size: 14px; margin: 20px 0;">Or copy and paste this link: <span style="word-break: break-all; color: #3b82f6;">${context.invite_link}</span></p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">${footerHtml}</p>
  </div>
  <img src="${trackingPixelUrl}" width="1" height="1" style="display: none;" alt="" />
</body>
</html>
  `.trim();

  const textParts: string[] = [];
  if (Array.isArray(template.body_sections)) {
    (template.body_sections as { content?: string }[]).forEach((block) => {
      if (block && typeof block.content === "string") {
        textParts.push(replacePlaceholders(block.content, context));
      }
    });
  }
  if (customMessage) {
    textParts.push(replacePlaceholders(customMessage, context));
  }
  textParts.push(`${ctaText}: ${context.invite_link}`);
  textParts.push(footerHtml);
  const text = textParts.join("\n\n");

  return { subject, html, text };
}

/**
 * Build HTML for live preview in the editor from form fields (same layout as sent email).
 */
export function buildPreviewHtmlFromFields(
  subject: string,
  headerHtml: string,
  bodySections: { type?: string; content?: string }[],
  ctaText: string,
  footerHtml: string,
  context: InviteTemplateContext,
  previewLink: string = "#"
): string {
  const header =
    headerHtml.trim() ||
    `<div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;"><h1 style="color: white; margin: 0; font-size: 24px;">Yiba Verified</h1><p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">QCTO-recognised platform</p></div>`;
  const bodyHtml = (bodySections || [])
    .map((block) => {
      const content =
        typeof block === "object" && block && "content" in block
          ? String(block.content ?? "")
          : String(block);
      return `<p style="color: #4b5563; font-size: 16px; margin: 16px 0;">${replacePlaceholders(content, context)}</p>`;
    })
    .join("");
  const cta = ctaText.trim() || "Review invitation";
  const footer = footerHtml.trim() || "If you didn't expect this invitation, you can safely ignore this email. Questions? support@yibaverified.co.za";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${replacePlaceholders(subject, context)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${replacePlaceholders(header, context)}
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    ${bodyHtml}
    <div style="margin: 30px 0; text-align: center;">
      <a href="${previewLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">${replacePlaceholders(cta, context)}</a>
    </div>
    <p style="color: #9ca3af; font-size: 14px; margin: 20px 0;">Or copy and paste this link: <span style="word-break: break-all; color: #3b82f6;">${context.invite_link}</span></p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">${replacePlaceholders(footer, context)}</p>
  </div>
</body>
</html>
  `.trim();
}

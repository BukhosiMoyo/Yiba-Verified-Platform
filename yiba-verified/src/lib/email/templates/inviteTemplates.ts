/**
 * Invite email template resolution and HTML building.
 * Maps invite role to EmailTemplateType; builds HTML from template + placeholders; fallback to default.
 */

import type { UserRole } from "@prisma/client";
import type { EmailTemplate } from "@prisma/client";
import { replacePlaceholders, type InviteTemplateContext } from "./placeholders";
import { getSharedEmailLayout } from "../layout";
import { EMAIL_CONFIG, EmailType } from "../types";

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
  customMessage?: string | null,
  reviewLink?: string, // New optional parameter for "Review Invitation"
  logoUrl?: string | null,
  darkLogoUrl?: string | null,
  aiOverride?: { subject: string; body_html: string; preview_text: string } | null
): { subject: string; html: string; text: string } {
  // removed require


  const subject = aiOverride?.subject || replacePlaceholders(template.subject, context);

  // Build Body Content
  // If AI override is present, use it directly. Otherwise build from template.
  const bodyHtml = aiOverride?.body_html || buildBodyHtml(template.body_sections, context);

  const customBlock = customMessage && !aiOverride // If AI wrote the email, custom message is likely redundant or should be part of context
    ? `<p style="margin: 16px 0; font-style: italic; border-left: 3px solid #e5e7eb; padding-left: 12px; color: #4b5563;">${replacePlaceholders(customMessage, context)}</p>`
    : "";

  const ctaText = replacePlaceholders(template.cta_text || "Accept Invitation", context);

  // Dual CTA Logic
  // Primary: Accept (trackedLink)
  // Secondary: Review (reviewLink) - optional

  let buttonsHtml = "";

  if (reviewLink) {
    // Mobile: Stacked, Desktop: Side-by-side
    buttonsHtml = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" class="btn-container" style="margin: 32px 0;">
        <tr>
          <td align="center">
            <!--[if mso]>
            <table border="0" cellpadding="0" cellspacing="0">
            <tr>
            <td style="padding-right: 12px;">
            <![endif]-->
            
            <a href="${trackedLink}" class="btn" style="display: inline-block; background: #2563eb; color: white; font-weight: 600; font-size: 16px; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 12px; min-width: 140px; text-align: center;">
              ${ctaText}
            </a>
            
            <!--[if mso]>
            </td>
            <td style="padding-left: 12px;">
            <![endif]-->
            
            <a href="${reviewLink}" class="btn" style="display: inline-block; background: transparent; color: #374151; font-weight: 500; font-size: 16px; padding: 12px 24px; text-decoration: none; border-radius: 6px; border: 1px solid #d1d5db; min-width: 140px; text-align: center;">
              Review Invitation
            </a>
            
            <!--[if mso]>
            </td>
            </tr>
            </table>
            <![endif]-->
          </td>
        </tr>
      </table>
     `;
  } else {
    // Single Button
    buttonsHtml = `
      <div style="margin: 32px 0; text-align: center;">
        <a href="${trackedLink}" style="display: inline-block; background: #2563eb; color: white; font-weight: 600; font-size: 16px; padding: 14px 32px; text-decoration: none; border-radius: 8px;">
          ${ctaText}
        </a>
      </div>
     `;
  }

  // Compose Inner Content
  const contentHtml = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">
      ${replacePlaceholders(subject.replace("You're invited", "Invitation"), context)}
    </h1>
    
    ${bodyHtml}
    ${customBlock}
    
    ${buttonsHtml}
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
      Or copy and paste this link: <br>
      <a href="${context.invite_link}" style="color: #2563eb; word-break: break-all;">${context.invite_link}</a>
    </p>
  `;

  // Resolve central preview text
  // AI override takes precedence
  const previewText = aiOverride?.preview_text || replacePlaceholders(EMAIL_CONFIG[EmailType.INVITE].previewText, context);

  const html = getSharedEmailLayout({
    contentHtml,
    title: subject,
    previewText: previewText,
    logoUrl,
    darkLogoUrl,
  });

  // Inject tracking pixel at the end (outside layout or inside? Layout returns full <html>, so we append before </body>)
  const htmlWithPixel = html.replace("</body>", `<img src="${trackingPixelUrl}" width="1" height="1" style="display: none;" alt="" /></body>`);


  // Text version
  const textParts: string[] = [];
  textParts.push(subject.toUpperCase());
  textParts.push("---");

  if (aiOverride) {
    // Basic strip HTML for text version (very crude, but robust enough for this context or use aiOverride.body_text if we had it)
    textParts.push(aiOverride.body_html.replace(/<[^>]*>?/gm, ""));
  } else if (Array.isArray(template.body_sections)) {
    (template.body_sections as { content?: string }[]).forEach((block) => {
      if (block && typeof block.content === "string") {
        textParts.push(replacePlaceholders(block.content, context));
      }
    });
  }

  if (customMessage && !aiOverride) {
    textParts.push(`Note: ${replacePlaceholders(customMessage, context)}`);
  }
  textParts.push(`Accept: ${context.invite_link}`);
  if (reviewLink) {
    textParts.push(`Review: ${reviewLink}`);
  }

  const text = textParts.join("\n\n");

  return { subject, html: htmlWithPixel, text };
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

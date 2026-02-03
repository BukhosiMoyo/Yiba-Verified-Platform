/**
 * Base Email Template components for consistent branding across all system emails.
 */

export const EMAIL_STYLES = {
    container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;',
    header: 'background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center; border-radius: 8px 8px 0 0;',
    headerTitle: 'color: white; margin: 0; font-size: 24px;',
    headerSubtitle: 'color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;',
    body: 'background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;',
    buttonContainer: 'margin: 30px 0; text-align: center;',
    button: 'display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;',
    linkText: 'word-break: break-all; color: #3b82f6;',
    footer: 'color: #9ca3af; font-size: 12px; margin: 0; text-align: center;',
    hr: 'border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;'
};

interface BaseTemplateOptions {
    subject: string;
    heading?: string;
    subheading?: string;
    bodyHtml: string;
    actionLabel?: string;
    actionUrl?: string;
    footerText?: string;
}

export function buildBaseEmailHtml(options: BaseTemplateOptions): string {
    const {
        subject,
        heading = "Yiba Verified",
        subheading = "QCTO-recognised platform",
        bodyHtml,
        actionLabel,
        actionUrl,
        footerText = "If you didn't expect this email, you can safely ignore it. Questions? support@yibaverified.co.za"
    } = options;

    const buttonHtml = actionLabel && actionUrl
        ? `
        <div style="${EMAIL_STYLES.buttonContainer}">
            <a href="${actionUrl}" style="${EMAIL_STYLES.button}">${actionLabel}</a>
        </div>
        <p style="color: #9ca3af; font-size: 14px; margin: 20px 0;">Or copy and paste this link: <span style="${EMAIL_STYLES.linkText}">${actionUrl}</span></p>
        `
        : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="${EMAIL_STYLES.container}">
  <div style="${EMAIL_STYLES.header}">
    <h1 style="${EMAIL_STYLES.headerTitle}">${heading}</h1>
    <p style="${EMAIL_STYLES.headerSubtitle}">${subheading}</p>
  </div>
  <div style="${EMAIL_STYLES.body}">
    ${bodyHtml}
    ${buttonHtml}
    <hr style="${EMAIL_STYLES.hr}">
    <p style="${EMAIL_STYLES.footer}">${footerText}</p>
  </div>
</body>
</html>
    `.trim();
}

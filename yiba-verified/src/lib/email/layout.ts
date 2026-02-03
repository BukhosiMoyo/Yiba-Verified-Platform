/**
 * Shared Email Layout
 * Enforces a centered "card" design with consistent header, footer, and mobile responsiveness.
 */

interface EmailLayoutProps {
  contentHtml: string;
  title?: string;
  previewText?: string;
}

export function getSharedEmailLayout({
  contentHtml,
  title = "Yiba Verified",
  previewText,
}: EmailLayoutProps): string {
  // Base styles for consistency across clients
  const styles = {
    body: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6; width: 100%;",
    containerWrapper: "background-color: #f3f4f6; padding: 40px 20px; width: 100%;",
    container: "max-width: 640px; margin: 0 auto; width: 100%;",
    card: "background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);",
    header: "padding: 32px 32px 0 32px; text-align: left;", // Logo top-left
    content: "padding: 32px;",
    footer: "padding: 24px; text-align: center; color: #6b7280; font-size: 13px;",
    link: "color: #2563eb; text-decoration: none;",
  };

  const currentYear = new Date().getFullYear();
  const baseUrl = process.env.NEXTAUTH_URL || "https://yibaverified.co.za";
  const logoUrl = `${baseUrl}/images/logo-black.png`; // Fallback to text if missing, but typically we want a logo here. 
  // NOTE: Ensure we have a public logo URL. For now we'll assume one exists or use text.

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <style>
    table {border-collapse: collapse; table-layout: fixed; width: 100%;}
    table table {table-layout: auto;}
  </style>
  <![endif]-->
  <style>
    /* Reset & Mobile Styles */
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { border: 0; outline: none; text-decoration: none; display: block; max-width: 100%; }
    
    /* Mobile Responsive */
    @media only screen and (max-width: 600px) {
      .container-wrapper { padding: 20px 10px !important; }
      .content { padding: 24px 20px !important; }
      .header { padding: 24px 20px 0 24px !important; }
      .btn { width: 100% !important; display: block !important; margin-bottom: 12px !important; text-align: center !important; }
      .btn-container { text-align: center !important; }
    }
  </style>
</head>
<body style="${styles.body}">
  ${previewText ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ""}
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.containerWrapper}" class="container-wrapper">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.container}" class="container">
          <tr>
            <td align="center">
              
              <!-- Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="${styles.card}">
                
                <!-- Header: Logo -->
                <tr>
                  <td style="${styles.header}" class="header">
                     <!-- Using text for reliability if logo fails, otherwise <img src="..." height="28" /> -->
                     <img src="${baseUrl}/Yiba%20Verified%20Logo.webp" alt="Yiba Verified" height="40" style="display: block; border: 0; max-width: 200px; height: auto;" />
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="${styles.content}" class="content">
                    <div style="color: #374151; font-size: 16px; line-height: 1.6;">
                      ${contentHtml}
                    </div>
                  </td>
                </tr>

              </table>
              <!-- End Card -->

              <!-- Footer -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="${styles.footer}">
                    <p style="margin: 0 0 12px 0;">Need help? <a href="mailto:support@yibaverified.co.za" style="${styles.link}">Contact Support</a></p>
                    <p style="margin: 0;">&copy; ${currentYear} Yiba Verified. All rights reserved.</p>
                    <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                      If you didn't expect this email, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
        <!-- End Main Container -->

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

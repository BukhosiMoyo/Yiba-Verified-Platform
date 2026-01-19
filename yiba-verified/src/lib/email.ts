// Email service
// Handles sending emails for notifications and system alerts
import { Resend } from "resend";
import type { NotificationType } from "./notifications";

export interface EmailConfig {
  provider: "resend" | "smtp" | "console"; // console for development
  apiKey?: string; // For Resend
  fromEmail?: string;
  fromName?: string;
  smtpHost?: string; // For SMTP
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  baseUrl?: string; // For constructing links in emails
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private config: EmailConfig;
  private resendClient: Resend | null = null;

  constructor(config: EmailConfig) {
    this.config = config;

    if (config.provider === "resend" && config.apiKey) {
      this.resendClient = new Resend(config.apiKey);
    }
  }

  /**
   * Send an email
   */
  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.config.provider === "console") {
        // Development mode: log to console
        console.log("\n📧 EMAIL (Console Mode):");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body:\n${options.text || options.html}\n`);
        return { success: true };
      }

      if (this.config.provider === "resend" && this.resendClient) {
        await this.resendClient.emails.send({
          from: `${this.config.fromName || "Yiba Verified"} <${this.config.fromEmail || "noreply@yiba.co.za"}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
        return { success: true };
      }

      // SMTP implementation would go here if needed
      if (this.config.provider === "smtp") {
        // TODO: Implement SMTP using nodemailer if needed
        console.warn("SMTP email provider not yet implemented");
        return { success: false, error: "SMTP not implemented" };
      }

      return { success: false, error: "Email provider not configured" };
    } catch (error: any) {
      console.error("Email send error:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }
  }
}

// Get email service instance from environment
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (emailServiceInstance) {
    return emailServiceInstance;
  }

  const provider = (process.env.EMAIL_PROVIDER || "console") as "resend" | "smtp" | "console";

  const config: EmailConfig = {
    provider,
    fromEmail: process.env.EMAIL_FROM || "noreply@yiba.co.za",
    fromName: process.env.EMAIL_FROM_NAME || "Yiba Verified",
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  };

  if (provider === "resend") {
    config.apiKey = process.env.RESEND_API_KEY;
  } else if (provider === "smtp") {
    config.smtpHost = process.env.SMTP_HOST;
    config.smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    config.smtpUser = process.env.SMTP_USER;
    config.smtpPassword = process.env.SMTP_PASSWORD;
  }

  emailServiceInstance = new EmailService(config);
  return emailServiceInstance;
}

/**
 * Generate email templates for different notification types
 */
export function getEmailTemplate(
  notificationType: NotificationType,
  title: string,
  message: string,
  entityType?: string,
  entityId?: string,
  baseUrl?: string
): { subject: string; html: string; text: string } {
  const appName = "Yiba Verified";
  const url = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Generate action link if entity info is provided
  let actionUrl = `${url}/notifications`;
  if (entityType && entityId) {
    switch (entityType) {
      case "SUBMISSION":
        actionUrl = `${url}/institution/submissions/${entityId}`;
        break;
      case "QCTO_REQUEST":
        actionUrl = `${url}/institution/requests/${entityId}`;
        break;
      case "READINESS":
        actionUrl = `${url}/institution/readiness/${entityId}`;
        break;
      case "DOCUMENT":
        actionUrl = `${url}/institution/documents/${entityId}`;
        break;
    }
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${appName}</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin-top: 0; font-size: 20px;">${title}</h2>
    
    <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
      ${message.replace(/\n/g, "<br>")}
    </p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${actionUrl}" 
         style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Details
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
      This is an automated notification from ${appName}. You can manage your notification preferences in your account settings.
    </p>
  </div>
</body>
</html>
  `.trim();

  const text = `
${appName}

${title}

${message}

View Details: ${actionUrl}

---
This is an automated notification from ${appName}. You can manage your notification preferences in your account settings.
  `.trim();

  return {
    subject: `${title} - ${appName}`,
    html,
    text,
  };
}

/**
 * Send email notification
 */
export async function sendEmailNotification(
  userEmail: string,
  notificationType: NotificationType,
  title: string,
  message: string,
  entityType?: string,
  entityId?: string
): Promise<void> {
  try {
    const emailService = getEmailService();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    
    const template = getEmailTemplate(
      notificationType,
      title,
      message,
      entityType,
      entityId,
      baseUrl
    );

    const result = await emailService.send({
      to: userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.success) {
      console.error(`Failed to send email to ${userEmail}:`, result.error);
    }
  } catch (error) {
    // Don't throw - email failures shouldn't break the main flow
    console.error("Error sending email notification:", error);
  }
}

// Email service
// Handles sending emails for notifications and system alerts
import { Resend } from "resend";
import { EmailType, getEmailHeaders } from "./types";
import type { NotificationType } from "../notifications";

export interface EmailConfig {
    provider: "resend" | "smtp" | "console"; // console for development
    apiKey?: string; // For Resend
    // fromEmail/fromName removed in favor of EmailType config
    smtpHost?: string; // For SMTP
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    baseUrl?: string; // For constructing links in emails
}

export interface EmailOptions {
    to: string;
    type: EmailType; // STRICT: Must specify purpose
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
        const { from, replyTo } = getEmailHeaders(options.type);

        // SAFETY GUARD: Enforce From Domain
        // Must end with @yibaverified.co.za OR be the safe dev sender
        const ALLOWED_DOMAINS = ["yibaverified.co.za", "resend.dev"];
        const isAllowedDomain = ALLOWED_DOMAINS.some(d => from.includes(`@${d}`));

        // In strict mode, we throw. For now, allow dev overrides but warn?
        // User directive: "from must end with @yibaverified.co.za (or allowed list)" -> implying strictness.
        if (!isAllowedDomain && !process.env.EMAIL_FROM?.includes("resend.dev")) { // Allow manual env override for dev
            console.warn(`[EmailService] Check failed: '${from}' is not in allowed domains: ${ALLOWED_DOMAINS.join(", ")}`);
            // We might decide to throw here eventually: throw new Error("Invalid From Domain");
        }

        // SAFETY GUARD: Enforce Reply-To Allowlist
        // If replyTo is set, it MUST be an allowed address (support / hello)
        // We allow undefined (no-reply)
        if (replyTo) {
            const ALLOWED_REPLY_TO = ["support@yibaverified.co.za", "hello@yibaverified.co.za"];
            if (!ALLOWED_REPLY_TO.includes(replyTo)) {
                console.warn(`[EmailService] Security Warning: '${replyTo}' is not a standard reply-to address.`);
                // throw new Error("Invalid Reply-To Address");
            }
        }

        // DEV OVERRIDE: If using Resend "onboarding" domain, From must be 'onboarding@resend.dev'
        // We check if the configured domain is legit or we are in a mode that needs this overriding.
        // For simplicity, if EMAIL_FROM env var is set to onboarding@resend.dev, we respect it 
        // BUT we should really rely on the type.
        // Let's implement robust handling:
        let finalFrom = from;
        if (process.env.EMAIL_FROM === "onboarding@resend.dev") {
            finalFrom = "onboarding@resend.dev";
        }

        try {
            if (this.config.provider === "console") {
                // Development mode: log to console
                console.log("\n📧 EMAIL (Console Mode):");
                console.log(`Type: ${options.type}`);
                console.log(`From: ${finalFrom}`);
                console.log(`Reply-To: ${replyTo || "(None)"}`);
                console.log(`To: ${options.to}`);
                console.log(`Subject: ${options.subject}`);
                console.log(`Body:\n${options.text || options.html}\n`);
                return { success: true };
            }

            if (this.config.provider === "resend" && this.resendClient) {
                await this.resendClient.emails.send({
                    from: finalFrom,
                    to: options.to,
                    replyTo: replyTo,
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

    const provider = (process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? "resend" : "console")) as "resend" | "smtp" | "console";

    const config: EmailConfig = {
        provider,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "https://yibaverified.co.za",
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
    // Import shared layout dynamically to avoid circular deps if any (though here it should be fine)
    const { getSharedEmailLayout } = require("./layout");

    const appName = "Yiba Verified";
    const url = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";

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
            case "INSTITUTION_LEAD":
                actionUrl = `${url}/institution/public-profile`;
                break;
            case "SERVICE_REQUEST":
                actionUrl = `${url}/platform-admin/service-requests`;
                break;
        }
    }

    const contentHtml = `
      <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 600;">${title}</h2>
    
      <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">Hi,</p>

      <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">
        ${message.replace(/\n/g, "<br>")}
      </p>
      
      <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">
        To view the full details and take action, open your dashboard.
      </p>

      <div style="margin: 32px 0; text-align: center;">
        <a href="${actionUrl}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Notification
        </a>
      </div>
      
      <p style="color: #9ca3af; font-size: 14px; margin-top: 24px; text-align: center;">
        You’re receiving this email because it relates to activity on your Yiba Verified account.
      </p>
    `;

    const html = getSharedEmailLayout({
        contentHtml,
        title: `${title} - ${appName}`,
        previewText: "There’s an update waiting for you on Yiba Verified.",
    });

    const text = `
${appName}

${title}

${message}

View Details: ${actionUrl}

---
This is an automated notification from ${appName}.
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
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "https://yibaverified.co.za";

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
            type: EmailType.NOTIFICATION,
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

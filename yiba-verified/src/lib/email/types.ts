
export enum EmailType {
    INVITE = "INVITE",
    PASSWORD_RESET = "PASSWORD_RESET",
    VERIFICATION = "VERIFICATION", // Email verification
    WELCOME = "WELCOME",
    NOTIFICATION = "NOTIFICATION",
    INACTIVITY = "INACTIVITY",
    SYSTEM_ALERT = "SYSTEM_ALERT"
}

interface EmailTypeConfig {
    fromLocal: string; // The "invites" part of invites@...
    fromName: string;
    replyTo?: string; // If undefined, behaves as no-reply (or explicit no-reply@) 
}

// Domain is central - usually yibaverified.co.za
const DOMAIN = process.env.EMAIL_DOMAIN || "yibaverified.co.za";
const SUPPORT_EMAIL = `support@${DOMAIN}`;

export const EMAIL_CONFIG: Record<EmailType, EmailTypeConfig> = {
    [EmailType.INVITE]: {
        fromLocal: "invites",
        fromName: "Yiba Verified Invites",
        replyTo: SUPPORT_EMAIL, // CHANGED: Now replyable per directive
    },
    [EmailType.PASSWORD_RESET]: {
        fromLocal: "no-reply",
        fromName: "Yiba Verified Security",
        // No reply-to
    },
    [EmailType.VERIFICATION]: {
        fromLocal: "no-reply",
        fromName: "Yiba Verified Security",
        // No reply-to
    },
    [EmailType.WELCOME]: {
        fromLocal: "notifications",
        fromName: "Yiba Verified",
        replyTo: SUPPORT_EMAIL, // Replyable
    },
    [EmailType.NOTIFICATION]: {
        fromLocal: "notifications",
        fromName: "Yiba Verified",
        replyTo: SUPPORT_EMAIL, // Replyable
    },
    [EmailType.INACTIVITY]: {
        fromLocal: "notifications",
        fromName: "Yiba Verified",
        // No reply-to
    },
    [EmailType.SYSTEM_ALERT]: {
        fromLocal: "no-reply",
        fromName: "Yiba Verified System",
        // No reply-to
    }
};

export function getEmailHeaders(type: EmailType) {
    const config = EMAIL_CONFIG[type];
    const domain = process.env.EMAIL_DOMAIN || "yibaverified.co.za";

    // NOTE: If using a verified domain in Resend, checks must be passed.
    // For dev (onboarding@resend.dev), we might override specific behaviors or just force it.
    // But per spec, we implement the PROD rules.

    // Handling Dev Mode overrides safely could happen in email.ts, but here we define intent.

    return {
        from: `${config.fromName} <${config.fromLocal}@${domain}>`,
        replyTo: config.replyTo,
    };
}

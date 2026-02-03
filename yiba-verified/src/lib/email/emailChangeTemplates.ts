/**
 * Email Change Templates
 * Beautiful, responsive email templates for email change flow
 */

const baseStyles = `
  body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; }
  .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center; }
  .header-icon { width: 64px; height: 64px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
  .header h1 { color: #ffffff; font-size: 24px; font-weight: 600; margin: 0; }
  .content { padding: 32px; }
  .content p { color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
  .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
  .button:hover { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); }
  .info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 24px 0; }
  .info-box p { color: #0369a1; margin: 0; font-size: 14px; }
  .warning-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0; }
  .warning-box p { color: #92400e; margin: 0; font-size: 14px; }
  .alert-box { background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 24px 0; }
  .alert-box p { color: #991b1b; margin: 0; font-size: 14px; }
  .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
  .detail-label { color: #6b7280; font-size: 14px; }
  .detail-value { color: #111827; font-size: 14px; font-weight: 500; }
  .footer { padding: 24px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; }
  .footer p { color: #6b7280; font-size: 12px; margin: 0 0 8px 0; }
  .footer a { color: #3b82f6; text-decoration: none; }
  .security-tip { background: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 24px; }
  .security-tip p { color: #4b5563; font-size: 13px; margin: 0; }
`;

interface VerifyNewEmailParams {
  userName: string;
  newEmail: string;
  verificationUrl: string;
  expiresIn: string;
}

export function generateVerifyNewEmailHtml({
  userName,
  newEmail,
  verificationUrl,
  expiresIn,
}: VerifyNewEmailParams): string {
  const { getSharedEmailLayout } = require("./layout");

  const contentHtml = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">Verify Your New Email</h1>
    
    <p>Hi ${userName},</p>
    
    <p>You requested to change your Yiba Verified account email to:</p>
    
    <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 16px; margin: 24px 0; color: #1e40af; font-weight: 600;">
      ${newEmail}
    </div>
    
    <p>Click the button below to verify this email address and complete the change:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email Address</a>
    </div>
    
    <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">⏰ This link expires in <strong>${expiresIn}</strong>.</p>
    </div>
    
    <p>If you didn't request this change, you can safely ignore this email. Your account email will remain unchanged.</p>
    
    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 24px;">
      <p style="color: #4b5563; font-size: 13px; margin: 0;">🔒 <strong>Security tip:</strong> Never share this link with anyone. Yiba Verified will never ask you for your password via email.</p>
    </div>
  `;

  return getSharedEmailLayout({
    contentHtml,
    title: "Verify Your New Email",
    previewText: `Verify your new email address: ${newEmail}`,
  });
}

export function generateVerifyNewEmailText({
  userName,
  newEmail,
  verificationUrl,
  expiresIn,
}: VerifyNewEmailParams): string {
  return `
Hi ${userName},

You requested to change your Yiba Verified account email to: ${newEmail}

Click the link below to verify this email address and complete the change:
${verificationUrl}

This link expires in ${expiresIn}.

If you didn't request this change, you can safely ignore this email. Your account email will remain unchanged.

Security tip: Never share this link with anyone.

---
Yiba Verified
support@yibaverified.co.za
`;
}

interface NotifyOldEmailParams {
  userName: string;
  currentEmail: string;
  newEmailMasked: string;
  requestedAt: string;
  ipAddress: string;
}

export function generateNotifyOldEmailHtml({
  userName,
  currentEmail,
  newEmailMasked,
  requestedAt,
  ipAddress,
}: NotifyOldEmailParams): string {
  const { getSharedEmailLayout } = require("./layout");

  const contentHtml = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">Email Change Requested</h1>
    
    <p>Hi ${userName},</p>
    
    <p>Someone requested to change the email address on your Yiba Verified account. Here are the details:</p>
    
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <span style="color: #6b7280; font-size: 14px;">Current email</span>
        <span style="color: #111827; font-size: 14px; font-weight: 500;">${currentEmail}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <span style="color: #6b7280; font-size: 14px;">Requested new email</span>
        <span style="color: #111827; font-size: 14px; font-weight: 500;">${newEmailMasked}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <span style="color: #6b7280; font-size: 14px;">Requested at</span>
        <span style="color: #111827; font-size: 14px; font-weight: 500;">${requestedAt}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: #6b7280; font-size: 14px;">IP Address</span>
        <span style="color: #111827; font-size: 14px; font-weight: 500;">${ipAddress}</span>
      </div>
    </div>
    
    <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="color: #1e40af; margin: 0; font-size: 14px;"><strong>If this was you:</strong> Check your new email inbox (${newEmailMasked}) for the verification link to complete the change.</p>
    </div>
    
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="color: #991b1b; margin: 0; font-size: 14px;"><strong>If this wasn't you:</strong></p>
      <p style="color: #991b1b; margin: 8px 0 0 0; font-size: 14px;">1. Log in immediately and change your password</p>
      <p style="color: #991b1b; margin: 4px 0 0 0; font-size: 14px;">2. Contact support at <a href="mailto:support@yibaverified.co.za" style="color: #991b1b; text-decoration: underline;">support@yibaverified.co.za</a></p>
    </div>
  `;

  return getSharedEmailLayout({
    contentHtml,
    title: "Email Change Requested",
    previewText: "Security Alert: Email change requested for your account",
  });
}

export function generateNotifyOldEmailText({
  userName,
  currentEmail,
  newEmailMasked,
  requestedAt,
  ipAddress,
}: NotifyOldEmailParams): string {
  return `
Hi ${userName},

SECURITY ALERT: Email Change Requested

Someone requested to change the email address on your Yiba Verified account.

Details:
- Current email: ${currentEmail}
- Requested new email: ${newEmailMasked}
- Requested at: ${requestedAt}
- IP Address: ${ipAddress}

If this was you:
Check your new email inbox for the verification link.

If this wasn't you:
1. Log in immediately and change your password
2. Contact support at support@yibaverified.co.za

---
Yiba Verified - Security Notification
`;
}

interface ConfirmChangeParams {
  userName: string;
  oldEmail: string;
  newEmail: string;
  changedAt: string;
}

export function generateConfirmChangeHtml({
  userName,
  oldEmail,
  newEmail,
  changedAt,
}: ConfirmChangeParams): string {
  const { getSharedEmailLayout } = require("./layout");

  const contentHtml = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">Email Successfully Changed</h1>
    
    <p>Hi ${userName},</p>
    
    <p>The email address on your Yiba Verified account has been successfully changed.</p>
    
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <span style="color: #6b7280; font-size: 14px;">Previous email</span>
        <span style="color: #111827; font-size: 14px; font-weight: 500;">${oldEmail}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <span style="color: #6b7280; font-size: 14px;">New email</span>
        <span style="color: #111827; font-size: 14px; font-weight: 500;">${newEmail}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: #6b7280; font-size: 14px;">Changed at</span>
        <span style="color: #111827; font-size: 14px; font-weight: 500;">${changedAt}</span>
      </div>
    </div>
    
    <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="color: #1e40af; margin: 0; font-size: 14px;">🔐 For security, all active sessions have been logged out. Please log in again with your new email address.</p>
    </div>
    
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="color: #991b1b; margin: 0; font-size: 14px;"><strong>Didn't make this change?</strong></p>
      <p style="color: #991b1b; margin: 8px 0 0 0; font-size: 14px;">Contact support immediately at <a href="mailto:support@yibaverified.co.za" style="color: #991b1b; text-decoration: underline;">support@yibaverified.co.za</a></p>
    </div>
  `;

  return getSharedEmailLayout({
    contentHtml,
    title: "Email Successfully Changed",
    previewText: "Your email address has been updated",
  });
}

export function generateConfirmChangeText({
  userName,
  oldEmail,
  newEmail,
  changedAt,
}: ConfirmChangeParams): string {
  return `
Hi ${userName},

Your Yiba Verified email has been successfully changed.

Previous email: ${oldEmail}
New email: ${newEmail}
Changed at: ${changedAt}

For security, all active sessions have been logged out. Please log in again with your new email address.

If you didn't make this change, contact support immediately at support@yibaverified.co.za

---
Yiba Verified - Security Notification
`;
}

interface WelcomeNewEmailParams {
  userName: string;
  newEmail: string;
}

export function generateWelcomeNewEmailHtml({
  userName,
  newEmail,
}: WelcomeNewEmailParams): string {
  const { getSharedEmailLayout } = require("./layout");

  const contentHtml = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">Email Verified Successfully!</h1>
    
    <p>Hi ${userName},</p>
    
    <p>Great news! Your email address has been successfully updated to:</p>
    
    <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="color: #1e40af; font-weight: 600; margin: 0;">${newEmail}</p>
    </div>
    
    <p>From now on, you'll receive all Yiba Verified notifications and communications at this email address.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.NEXTAUTH_URL || "https://yibaverified.co.za"}/login" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Log In to Your Account</a>
    </div>
    
    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-top: 24px;">
      <p style="color: #4b5563; font-size: 13px; margin: 0;">🔐 <strong>Reminder:</strong> All previous sessions have been logged out for security. You'll need to log in again.</p>
    </div>
  `;

  return getSharedEmailLayout({
    contentHtml,
    title: "Welcome to Your New Email",
    previewText: "Your email has been successfully updated",
  });
}

export function generateWelcomeNewEmailText({
  userName,
  newEmail,
}: WelcomeNewEmailParams): string {
  return `
Hi ${userName},

Great news! Your email address has been successfully updated to: ${newEmail}

From now on, you'll receive all Yiba Verified notifications and communications at this email address.

Log in to your account: ${process.env.NEXTAUTH_URL || "https://yibaverified.co.za"}/login

Reminder: All previous sessions have been logged out for security. You'll need to log in again.

---
Welcome aboard!
The Yiba Verified Team
`;
}

// Utility to mask email for security
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!domain) return email;

  const maskedLocal = localPart.length <= 2
    ? localPart[0] + "***"
    : localPart.slice(0, 2) + "***" + localPart.slice(-1);

  return `${maskedLocal}@${domain}`;
}

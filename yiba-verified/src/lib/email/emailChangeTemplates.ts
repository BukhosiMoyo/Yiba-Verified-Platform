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
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your New Email</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="header-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
        </div>
        <h1>Verify Your New Email</h1>
      </div>
      
      <div class="content">
        <p>Hi ${userName},</p>
        
        <p>You requested to change your Yiba Verified account email to:</p>
        
        <div class="info-box">
          <p><strong>${newEmail}</strong></p>
        </div>
        
        <p>Click the button below to verify this email address and complete the change:</p>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </div>
        
        <div class="warning-box">
          <p>⏰ This link expires in <strong>${expiresIn}</strong>.</p>
        </div>
        
        <p>If you didn't request this change, you can safely ignore this email. Your account email will remain unchanged.</p>
        
        <div class="security-tip">
          <p>🔒 <strong>Security tip:</strong> Never share this link with anyone. Yiba Verified will never ask you for your password via email.</p>
        </div>
      </div>
      
      <div class="footer">
        <p>This is an automated message from Yiba Verified.</p>
        <p>If you have questions, contact us at <a href="mailto:support@yibaverified.co.za">support@yibaverified.co.za</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;
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
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Change Requested</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
        <div class="header-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h1>Email Change Requested</h1>
      </div>
      
      <div class="content">
        <p>Hi ${userName},</p>
        
        <p>Someone requested to change the email address on your Yiba Verified account. Here are the details:</p>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <div class="detail-row">
            <span class="detail-label">Current email</span>
            <span class="detail-value">${currentEmail}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Requested new email</span>
            <span class="detail-value">${newEmailMasked}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Requested at</span>
            <span class="detail-value">${requestedAt}</span>
          </div>
          <div class="detail-row" style="border-bottom: none;">
            <span class="detail-label">IP Address</span>
            <span class="detail-value">${ipAddress}</span>
          </div>
        </div>
        
        <div class="info-box">
          <p><strong>If this was you:</strong> Check your new email inbox (${newEmailMasked}) for the verification link to complete the change.</p>
        </div>
        
        <div class="alert-box">
          <p><strong>If this wasn't you:</strong></p>
          <p style="margin-top: 8px;">1. Log in immediately and change your password</p>
          <p>2. Contact support at <a href="mailto:support@yibaverified.co.za" style="color: #991b1b;">support@yibaverified.co.za</a></p>
        </div>
      </div>
      
      <div class="footer">
        <p>This is an automated security notification from Yiba Verified.</p>
        <p>You're receiving this because an email change was requested for your account.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
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
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Successfully Changed</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
        <div class="header-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1>Email Successfully Changed</h1>
      </div>
      
      <div class="content">
        <p>Hi ${userName},</p>
        
        <p>The email address on your Yiba Verified account has been successfully changed.</p>
        
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <div class="detail-row">
            <span class="detail-label">Previous email</span>
            <span class="detail-value">${oldEmail}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">New email</span>
            <span class="detail-value">${newEmail}</span>
          </div>
          <div class="detail-row" style="border-bottom: none;">
            <span class="detail-label">Changed at</span>
            <span class="detail-value">${changedAt}</span>
          </div>
        </div>
        
        <div class="info-box">
          <p>🔐 For security, all active sessions have been logged out. Please log in again with your new email address.</p>
        </div>
        
        <div class="alert-box">
          <p><strong>Didn't make this change?</strong></p>
          <p style="margin-top: 8px;">Contact support immediately at <a href="mailto:support@yibaverified.co.za" style="color: #991b1b;">support@yibaverified.co.za</a></p>
        </div>
      </div>
      
      <div class="footer">
        <p>This is an automated security notification from Yiba Verified.</p>
        <p>This email was sent to your previous email address for security purposes.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
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
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Your New Email</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="header-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1>Email Verified Successfully!</h1>
      </div>
      
      <div class="content">
        <p>Hi ${userName},</p>
        
        <p>Great news! Your email address has been successfully updated to:</p>
        
        <div class="info-box">
          <p><strong>${newEmail}</strong></p>
        </div>
        
        <p>From now on, you'll receive all Yiba Verified notifications and communications at this email address.</p>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXTAUTH_URL || "https://yibaverified.co.za"}/login" class="button">Log In to Your Account</a>
        </div>
        
        <div class="security-tip">
          <p>🔐 <strong>Reminder:</strong> All previous sessions have been logged out for security. You'll need to log in again.</p>
        </div>
      </div>
      
      <div class="footer">
        <p>Welcome aboard!</p>
        <p>The Yiba Verified Team</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
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

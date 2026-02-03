
import { EmailType } from "../types";
const { getSharedEmailLayout } = require("../layout");

export function getJobRequestVerifyTemplate(
    companyName: string,
    candidateName: string,
    verifyUrl: string
): { subject: string; html: string; text: string } {
    const title = `Verify your request to hire ${candidateName}`;
    const previewText = `Confirm your email to send a job request to ${candidateName}`;

    const contentHtml = `
      <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 600;">Verify your job request</h2>
      
      <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">
        You (or someone at <strong>${companyName}</strong>) requested to contact <strong>${candidateName}</strong> on Yiba Verified.
      </p>

      <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">
        To ensure safety and prevent spam, please verify your email address. Once verified, your request will be delivered immediately.
      </p>

      <div style="margin: 32px 0; text-align: center;">
        <a href="${verifyUrl}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Verify & Send Request
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        If you didn't make this request, you can safely ignore this email.
      </p>
    `;

    const html = getSharedEmailLayout({
        contentHtml,
        title,
        previewText
    });

    const text = `
Verify your request to hire ${candidateName}

You requested to contact ${candidateName} on Yiba Verified.

Please verify your email to send the request:
${verifyUrl}

If you didn't make this request, ignore this email.
    `.trim();

    return { subject: title, html, text };
}

export function getJobOpportunityNotificationTemplate(
    candidateName: string,
    companyName: string,
    roleTitle: string,
    inboxUrl: string
): { subject: string; html: string; text: string } {
    const title = `New Job Opportunity: ${companyName}`;
    const previewText = `${companyName} wants to hire you as a ${roleTitle}`;

    const contentHtml = `
      <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 600;">New Opportunity!</h2>
      
      <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">
        Hi ${candidateName},
      </p>

      <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">
        <strong>${companyName}</strong> has sent you a request to discuss a role: <strong>${roleTitle}</strong>.
      </p>

      <div style="margin: 32px 0; text-align: center;">
        <a href="${inboxUrl}" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Opportunity
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        Log in to your profile to view the full message and respond.
      </p>
    `;

    const html = getSharedEmailLayout({
        contentHtml,
        title,
        previewText
    });

    const text = `
New Opportunity from ${companyName}

Hi ${candidateName},

${companyName} has sent you a request for the role: ${roleTitle}.

View Opportunity: ${inboxUrl}
    `.trim();

    return { subject: title, html, text };
}

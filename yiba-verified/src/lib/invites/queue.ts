// Invite Queue System
// Handles batch processing of invites with rate limiting and retry logic

import type { EmailTemplateType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEmailService } from "@/lib/email";
import { EmailType } from "@/lib/email/types";
import { getRawToken } from "./token-store";
import { getTemplateTypeForInviteRole, buildInviteEmailFromTemplate } from "@/lib/email/templates/inviteTemplates";

export interface QueueConfig {
  batchSize: number; // Number of invites per batch (default: 20)
  batchDelayMs: number; // Delay between batches in milliseconds (default: 120000 = 2 minutes)
  retryDelayMs: number; // Delay before retrying failed invites (default: 300000 = 5 minutes)
  maxAttempts: number; // Maximum retry attempts (default: 3)
}

const DEFAULT_CONFIG: QueueConfig = {
  batchSize: parseInt(process.env.INVITE_BATCH_SIZE || "20", 10),
  batchDelayMs: parseInt(process.env.INVITE_BATCH_DELAY_MS || "120000", 10),
  retryDelayMs: parseInt(process.env.INVITE_RETRY_DELAY_MS || "300000", 10),
  maxAttempts: parseInt(process.env.INVITE_MAX_ATTEMPTS || "3", 10),
};

/**
 * Generate invite email HTML with tracking
 */
function generateInviteEmail(
  inviteLink: string,
  email: string,
  role: string,
  institutionName?: string
): { html: string; text: string } {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";
  const trackingPixelUrl = `${baseUrl}/api/invites/track/open?token=${encodeURIComponent(inviteLink.split("token=")[1] || "")}`;
  const trackedLink = `${baseUrl}/api/invites/track/click?token=${encodeURIComponent(inviteLink.split("token=")[1] || "")}&redirect=${encodeURIComponent(inviteLink)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Yiba Verified</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Yiba Verified</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #111827; margin-top: 0; font-size: 20px;">You're Invited!</h2>
    
    <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
      You've been invited to join Yiba Verified${institutionName ? ` as part of ${institutionName}` : ""}.
    </p>
    
    <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
      Your role: <strong>${role.replace(/_/g, " ")}</strong>
    </p>
    
    <p style="color: #4b5563; font-size: 16px; margin: 20px 0;">
      Click the button below to accept your invitation and create your account. This link expires in 7 days.
    </p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${trackedLink}" 
         style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Accept Invitation
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; margin: 20px 0;">
      Or copy and paste this link into your browser:<br>
      <span style="word-break: break-all; color: #667eea;">${inviteLink}</span>
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
  
  <!-- Tracking pixel -->
  <img src="${trackingPixelUrl}" width="1" height="1" style="display: none;" alt="" />
</body>
</html>
  `.trim();

  const text = `
Yiba Verified - You're Invited!

You've been invited to join Yiba Verified${institutionName ? ` as part of ${institutionName}` : ""}.

Your role: ${role.replace(/_/g, " ")}

Click the link below to accept your invitation and create your account. This link expires in 7 days.

${inviteLink}

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();

  return { html, text };
}

/**
 * Process a single invite (send email)
 */
export async function processInvite(
  invite: any,
  config: QueueConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update status to SENDING
    await prisma.invite.update({
      where: { invite_id: invite.invite_id },
      data: {
        status: "SENDING",
        attempts: { increment: 1 },
        last_attempt_at: new Date(),
      },
    });

    // Get the raw token (we need to reconstruct it or store it separately)
    // For now, we'll generate a new token hash lookup
    // In production, you might want to store the raw token temporarily
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";

    // Get raw token from store
    const rawToken = getRawToken(invite.token_hash);
    if (!rawToken) {
      throw new Error("Raw token not found - invite may have expired or been processed");
    }

    // Get institution name and inviter name (if not already on invite)
    let institutionName: string | undefined;
    if (invite.institution_id) {
      const institution = await prisma.institution.findUnique({
        where: { institution_id: invite.institution_id },
        select: { trading_name: true, legal_name: true },
      });
      institutionName = institution?.trading_name || institution?.legal_name;
    }
    let inviterName: string = "A team member";
    if (invite.createdBy) {
      const parts = [invite.createdBy.first_name, invite.createdBy.last_name].filter(Boolean);
      inviterName = parts.length ? parts.join(" ") : inviterName;
    } else {
      const creator = await prisma.user.findUnique({
        where: { user_id: invite.created_by_user_id },
        select: { first_name: true, last_name: true },
      });
      if (creator) {
        const parts = [creator.first_name, creator.last_name].filter(Boolean);
        inviterName = parts.length ? parts.join(" ") : inviterName;
      }
    }

    // Generate invite link and tracked link / pixel
    const inviteLink = `${baseUrl}/invite?token=${rawToken}`;
    // Link to the new Review Walkthrough page
    const reviewLink = `${baseUrl}/invites/${rawToken}/review`;

    const trackingPixelUrl = `${baseUrl}/api/invites/track/open?token=${encodeURIComponent(rawToken)}`;
    const trackedLink = `${baseUrl}/api/invites/track/click?token=${encodeURIComponent(rawToken)}&redirect=${encodeURIComponent(inviteLink)}`;

    // Resolve template by invite role (or use invite.template_id if set)
    const templateType = invite.template_id
      ? (await prisma.emailTemplate.findUnique({ where: { id: invite.template_id } }))?.type
      : getTemplateTypeForInviteRole(invite.role);
    const template = templateType
      ? await prisma.emailTemplate.findUnique({ where: { type: templateType as EmailTemplateType } })
      : null;

    let subject: string;
    let html: string;
    let text: string;

    if (template && template.is_active) {
      const expiryDateFormatted = invite.expires_at
        ? invite.expires_at.toLocaleDateString(undefined, { dateStyle: "long" })
        : "";
      const context = {
        recipient_name: invite.email.split("@")[0] || "there",
        institution_name: institutionName || "the institution",
        inviter_name: inviterName,
        role: invite.role.replace(/_/g, " "),
        invite_link: inviteLink, // raw link for copy-paste line; CTA uses trackedLink
        action_url: inviteLink,
        expiry_date: expiryDateFormatted,
      };
      const built = buildInviteEmailFromTemplate(
        template,
        context,
        trackedLink,
        trackingPixelUrl,
        invite.custom_message ?? null,
        reviewLink // Pass review link for dual CTA
      );
      subject = built.subject;
      html = built.html;
      text = built.text;
    } else {
      const fallback = generateInviteEmail(
        inviteLink,
        invite.email,
        invite.role,
        institutionName
      );
      subject = "You're Invited to Yiba Verified";
      html = fallback.html;
      text = fallback.text;
    }

    // Send email
    const emailService = getEmailService();
    const result = await emailService.send({
      to: invite.email,
      type: EmailType.INVITE,
      subject,
      html,
      text,
    });

    if (result.success) {
      // Update status to SENT
      await prisma.invite.update({
        where: { invite_id: invite.invite_id },
        data: {
          status: "SENT",
          sent_at: new Date(),
        },
      });
      return { success: true };
    } else {
      // Handle failure
      const shouldRetry = invite.attempts < config.maxAttempts;

      await prisma.invite.update({
        where: { invite_id: invite.invite_id },
        data: {
          status: shouldRetry ? "RETRYING" : "FAILED",
          failure_reason: result.error || "Unknown error",
          retry_count: { increment: 1 },
          next_retry_at: shouldRetry
            ? new Date(Date.now() + config.retryDelayMs)
            : null,
        },
      });

      return { success: false, error: result.error };
    }
  } catch (error: any) {
    // Handle exception
    const shouldRetry = invite.attempts < config.maxAttempts;

    await prisma.invite.update({
      where: { invite_id: invite.invite_id },
      data: {
        status: shouldRetry ? "RETRYING" : "FAILED",
        failure_reason: error.message || "Exception occurred",
        retry_count: { increment: 1 },
        next_retry_at: shouldRetry
          ? new Date(Date.now() + config.retryDelayMs)
          : null,
      },
    });

    return { success: false, error: error.message };
  }
}

/**
 * Process a batch of invites
 */
export async function processInviteBatch(
  batchSize: number = DEFAULT_CONFIG.batchSize
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const config = DEFAULT_CONFIG;

  // Get next batch of QUEUED invites (oldest first), with createdBy for template context
  const queuedInvites = await prisma.invite.findMany({
    where: {
      status: "QUEUED",
      deleted_at: null,
      expires_at: { gt: new Date() }, // Not expired
    },
    orderBy: { created_at: "asc" },
    take: batchSize,
    include: {
      createdBy: { select: { first_name: true, last_name: true } },
    },
  });

  // Also get RETRYING invites that are ready to retry
  const retryInvites = await prisma.invite.findMany({
    where: {
      status: "RETRYING",
      deleted_at: null,
      expires_at: { gt: new Date() },
      next_retry_at: { lte: new Date() },
    },
    orderBy: { next_retry_at: "asc" },
    take: Math.max(1, Math.floor(batchSize / 4)), // Reserve some slots for retries
    include: {
      createdBy: { select: { first_name: true, last_name: true } },
    },
  });

  const invitesToProcess = [...queuedInvites, ...retryInvites].slice(0, batchSize);

  if (invitesToProcess.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  // Process invites sequentially to respect rate limits
  for (const invite of invitesToProcess) {
    const result = await processInvite(invite, config);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }

    // Small delay between individual sends (100ms)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    processed: invitesToProcess.length,
    succeeded,
    failed,
  };
}

/**
 * Start the queue processor (runs continuously)
 * This should be called from a background job or API route
 */
export async function startQueueProcessor(
  config: QueueConfig = DEFAULT_CONFIG
): Promise<void> {
  console.log("Starting invite queue processor...");

  while (true) {
    try {
      const result = await processInviteBatch(config.batchSize);

      if (result.processed > 0) {
        console.log(
          `Processed ${result.processed} invites: ${result.succeeded} succeeded, ${result.failed} failed`
        );
      }

      // Wait before next batch
      await new Promise((resolve) => setTimeout(resolve, config.batchDelayMs));
    } catch (error) {
      console.error("Error in queue processor:", error);
      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
}

// POST /api/invites - Create an invite (PLATFORM_ADMIN or INSTITUTION_ADMIN only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { randomBytes, createHash } from "crypto";
import { createAuditLog, serializeValue } from "@/services/audit.service";
import { EngagementState } from "@prisma/client";
import { generateEmailCopy } from "@/lib/ai/generateEmailCopy";

/**
 * POST /api/invites
 * Creates a new invite (PLATFORM_ADMIN or INSTITUTION_ADMIN only).
 * 
 * RBAC:
 * - PLATFORM_ADMIN can invite anyone
 * - INSTITUTION_ADMIN can invite INSTITUTION_STAFF and STUDENT only (scoped to their institution)
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Only PLATFORM_ADMIN or INSTITUTION_ADMIN
    if (ctx.role !== "PLATFORM_ADMIN" && ctx.role !== "INSTITUTION_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN or INSTITUTION_ADMIN can create invites",
        403
      );
    }

    // Verify requesting user actually exists in DB (handles stale sessions)
    const requestingUser = await prisma.user.findUnique({
      where: { user_id: ctx.userId },
      select: { user_id: true, deleted_at: true }
    });

    if (!requestingUser || requestingUser.deleted_at) {
      throw new AppError(
        ERROR_CODES.UNAUTHENTICATED,
        "User not found or account is inactive",
        401
      );
    }

    const body = await request.json();
    const { email, role, institution_id, default_province } = body;

    // Validation
    if (!email || !role) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Email and role are required",
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid email format",
        400
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser && !existingUser.deleted_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "User with this email already exists",
        400
      );
    }

    // Role validation based on caller
    let finalInstitutionId = institution_id;

    if (ctx.role === "INSTITUTION_ADMIN") {
      // INSTITUTION_ADMIN can invite INSTITUTION_ADMIN, INSTITUTION_STAFF, and STUDENT
      const allowed = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "STUDENT", "FACILITATOR"];
      if (!allowed.includes(role)) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "INSTITUTION_ADMIN can only invite Institution Admin, Staff, or Student",
          403
        );
      }
      // Use their institution_id
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Institution ID is required for institution-scoped invites",
          400
        );
      }
      finalInstitutionId = ctx.institutionId;
    } else if (ctx.role === "PLATFORM_ADMIN") {
      // PLATFORM_ADMIN can invite anyone
      // INSTITUTION_ADMIN may be invited without institution — they add institution(s) during onboarding
      // INSTITUTION_STAFF and STUDENT require an institution
      if (
        (role === "INSTITUTION_STAFF" || role === "STUDENT") &&
        !finalInstitutionId
      ) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Institution ID is required for Institution Staff and Student",
          400
        );
      }

      // Validate province for QCTO roles that require it
      const qctoRolesRequiringProvince = ["QCTO_ADMIN", "QCTO_USER", "QCTO_REVIEWER", "QCTO_AUDITOR", "QCTO_VIEWER"];
      if (qctoRolesRequiringProvince.includes(role) && !default_province) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Province is required for this QCTO role",
          400
        );
      }

      // Validate province is valid if provided
      if (default_province) {
        const { PROVINCES } = await import("@/lib/provinces");
        if (!PROVINCES.includes(default_province as any)) {
          throw new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            `Invalid province. Must be one of: ${PROVINCES.join(", ")}`,
            400
          );
        }
      }
    }

    // Validate institution exists if provided
    // Validate institution exists if provided
    let institution = null;
    if (finalInstitutionId) {
      institution = await prisma.institution.findUnique({
        where: { institution_id: finalInstitutionId },
      });
      if (!institution || institution.deleted_at) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Institution not found",
          400
        );
      }
    }

    // Generate secure token (32 bytes = 256 bits)
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    // Generate Engagement Token (long-lived)
    const engagementToken = randomBytes(32).toString("hex");

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store raw token temporarily for email generation
    const { storeToken } = await import("@/lib/invites/token-store");
    storeToken(tokenHash, rawToken, 168); // Store for 7 days

    // Invalidate previous pending invites for this email
    await prisma.invite.updateMany({
      where: {
        email: email.toLowerCase().trim(),
        status: { in: ["QUEUED", "SENT", "SENDING"] },
        expires_at: { gt: new Date() }, // Only if not already expired
      },
      data: {
        status: "EXPIRED",
        expires_at: new Date(), // Expire immediately
      },
    });

    // Create invite with QUEUED status and audit log
    const invite = await prisma.$transaction(async (tx) => {
      const createdInvite = await tx.invite.create({
        data: {
          email: email.toLowerCase().trim(),
          role,
          institution_id: finalInstitutionId || null,
          default_province: default_province || null,
          token_hash: tokenHash,
          expires_at: expiresAt,
          created_by_user_id: ctx.userId,
          status: "QUEUED",
          max_attempts: parseInt(process.env.INVITE_MAX_ATTEMPTS || "3", 10),

          // Intelligent Outreach Initialization
          engagement_token: engagementToken,
          engagement_state: EngagementState.UNCONTACTED,
          engagement_score_raw: 0,
        },
        select: {
          invite_id: true,
          email: true,
          role: true,
          institution_id: true,
          expires_at: true,
          created_at: true,
        },
      });

      // Create audit log for invite creation
      await createAuditLog(tx, {
        entityType: "USER",
        entityId: createdInvite.invite_id, // Use invite_id as entity ID since user doesn't exist yet
        fieldName: "invite_created",
        oldValue: null,
        newValue: serializeValue({
          email: createdInvite.email,
          role: createdInvite.role,
          institution_id: createdInvite.institution_id,
          default_province: default_province,
        }),
        changedBy: ctx.userId,
        roleAtTime: ctx.role,
        changeType: "CREATE",
        reason: `Invite created for ${role} role`,
        institutionId: finalInstitutionId || null,
      });

      return createdInvite;
    });

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yibaverified.co.za";
    const inviteLink = `${baseUrl}/invite?token=${rawToken}`;

    // Send email immediately
    try {
      const { getEmailService } = await import("@/lib/email");
      const { EmailType } = await import("@/lib/email/types");
      const { buildInviteEmailFromTemplate, getTemplateTypeForInviteRole } = await import("@/lib/email/templates/inviteTemplates");
      const { EMAIL_CONFIG } = await import("@/lib/email/types");

      const { getSystemSetting } = await import("@/lib/settings");

      const emailService = getEmailService();

      // Fetch logos
      const [logoUrl, darkLogoUrl] = await Promise.all([
        getSystemSetting("EMAIL_LOGO"),
        getSystemSetting("EMAIL_LOGO_DARK")
      ]);

      // 1. Generate URLs
      const reviewLink = `${baseUrl}/invites/${rawToken}/review`;
      const trackingPixelUrl = `${baseUrl}/api/invites/track/open?token=${encodeURIComponent(rawToken)}`;
      const trackedLink = `${baseUrl}/api/invites/track/click?token=${encodeURIComponent(rawToken)}&redirect=${encodeURIComponent(inviteLink)}`; // Point main CTA to direct accept

      // 2. Fetch Template
      const templateType = getTemplateTypeForInviteRole(role as any); // role validated above
      let template = null;
      if (templateType) {
        template = await prisma.emailTemplate.findUnique({ where: { type: templateType as any } });
      }

      // AI Content Generation (Institution Admin Only)
      let aiContent: any = null;
      if (role === "INSTITUTION_ADMIN") {
        try {
          // Fetch Strategy Directives for UNCONTACTED stage
          let strategyDirectives = "";
          try {
            const stageTemplate = await prisma.engagementStageTemplate.findUnique({
              where: { stage: EngagementState.UNCONTACTED }
            });
            if (stageTemplate?.ai_instructions) {
              // handle if ai_instructions is JSON or string
              const instructions = stageTemplate.ai_instructions as any;
              strategyDirectives = typeof instructions === 'string' ? instructions : JSON.stringify(instructions);
            }
          } catch (e) {
            console.warn("Could not fetch strategy directives:", e);
          }

          // We await here, adding ~1-3s latency. Acceptable for admin action.
          // In production, move to background worker.
          aiContent = await generateEmailCopy({
            institutionName: institution?.trading_name || institution?.legal_name || "your institution",
            recipientName: email.split("@")[0], // Fallback if no name provided
            role: "Institution Administrator",
            senderName: "Yiba Verified Platform",
            engagementState: "UNCONTACTED",
            // Deep Context Injection
            institutionProvince: institution?.province || undefined,
            institutionType: institution?.institution_type || undefined,
            strategyDirectives: strategyDirectives,
            interactionHistory: "First official invitation from Yiba Verified Platform."
          });
        } catch (aiErr) {
          console.warn("AI Email Generation Failed, falling back to template:", aiErr);
        }
      }

      // 3. Build Email Content
      let subject: string;
      let html: string;
      let text: string;
      let previewText: string;

      if (template && template.is_active) {
        // Use DB Template
        const context = {
          recipient_name: email.split("@")[0],
          institution_name: institution?.trading_name || institution?.legal_name || "the institution",
          inviter_name: "Yiba Verified", // Could fetch user name if needed
          role: role.replace(/_/g, " "),
          invite_link: inviteLink,
          action_url: inviteLink,
          expiry_date: expiresAt.toLocaleDateString("en-ZA", { dateStyle: "long" }),
        };

        // We pass reviewLink here
        const built = buildInviteEmailFromTemplate(
          template,
          context,
          trackedLink, // "Accept" button link
          trackingPixelUrl,
          null,
          reviewLink, // "Review" button link
          logoUrl,
          darkLogoUrl,
          aiContent // Pass AI override
        );
        subject = built.subject;
        html = built.html;
        text = built.text;

        // Resolve preview text using config as fallback
        const inviteConfig = EMAIL_CONFIG[EmailType.INVITE];
        previewText = inviteConfig.previewText;
      } else {
        // Fallback template (matches queue.ts fallback but using review link)
        // We can't easily access the `generateInviteEmail` helper from queue.ts without exporting it or duplicating.
        // Let's rely on buildBaseEmailHtml for fallback but cleaner.
        const { buildBaseEmailHtml } = await import("@/lib/email/templates/base");

        const fallbackHtml = `
            <p>You have been invited to join <strong>Yiba Verified</strong> as a <strong>${role.replace(/_/g, " ")}</strong>.</p>
            <p>We've introduced a new way to review your invitation details before accepting.</p>
            <div style="margin: 32px 0; text-align: center;">
               <a href="${reviewLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Review Invitation
               </a>
            </div>
            <p style="margin-top:20px; font-size:14px; color:#6b7280;">Or accept directly: <a href="${inviteLink}">Click here</a></p>
          `;

        subject = "You've been invited to Yiba Verified";
        previewText = "Review your invitation to join Yiba Verified";
        html = buildBaseEmailHtml({
          subject,
          heading: "Invitation to Yiba Verified",
          bodyHtml: fallbackHtml,
          previewText,
          logoUrl
        });
        text = `You've been invited. Review here: ${reviewLink}`;
      }

      // 4. Send
      const emailResult = await emailService.send({
        to: email,
        type: EmailType.INVITE,
        subject,
        html,
        text,
        previewText
      });

      if (emailResult.success) {
        // Update status to SENT only if email actually sent
        // Also advance Engagement State to CONTACTED
        await prisma.invite.update({
          where: { invite_id: invite.invite_id },
          data: {
            status: "SENT",
            sent_at: new Date(),
            engagement_state: EngagementState.CONTACTED,
            last_interaction_at: new Date(),
            engagement_score_raw: { increment: 5 } // Basic points for "Received Email" equivalent to Open? Or just generic
          }
        });

        // Update return object status
        (invite as any).status = "SENT";
      } else {
        console.error(`Email service returned failure for ${email}:`, emailResult.error);
        // Status remains QUEUED
      }

    } catch (emailErr) {
      console.error("Failed to call email service:", emailErr);
      // We don't fail the request, but we leave status as QUEUED so worker can pick it up if there is one
      // (Audit log already created)
    }

    return ok({
      ...invite,
      invite_link: inviteLink,
    });
  } catch (error) {
    console.error("POST /api/invites failed:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
    return fail(error);
  }
}

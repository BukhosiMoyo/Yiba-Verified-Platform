// POST /api/invites - Create an invite (PLATFORM_ADMIN or INSTITUTION_ADMIN only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { randomBytes, createHash } from "crypto";
import { createAuditLog, serializeValue } from "@/services/audit.service";

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
      const allowed = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "STUDENT"];
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
    if (finalInstitutionId) {
      const institution = await prisma.institution.findUnique({
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/invite?token=${rawToken}`;

    // Send email immediately
    try {
      const { getEmailService } = await import("@/lib/email");
      const { EmailType } = await import("@/lib/email/types");
      const { buildBaseEmailHtml } = await import("@/lib/email/templates/base");
      const emailService = getEmailService();

      const htmlBody = `
            <p style="font-size: 16px; margin-bottom: 20px;">You have been invited to join <strong>Yiba Verified</strong> as a <strong>${role.replace(/_/g, " ")}</strong>.</p>
            <p style="font-size: 16px;">To get started, please accept your invitation by clicking the button below. This link will expire in 7 days.</p>
        `;

      const emailHtml = buildBaseEmailHtml({
        subject: "You've been invited to Yiba Verified",
        bodyHtml: htmlBody,
        actionLabel: "Accept Invitation",
        actionUrl: inviteLink,
        heading: "Welcome to Yiba Verified"
      });

      const emailResult = await emailService.send({
        to: email,
        type: EmailType.INVITE,
        subject: "You've been invited to Yiba Verified",
        html: emailHtml,
        text: `You have been invited to Yiba Verified. Click here to accept: ${inviteLink}`,
      });

      if (emailResult.success) {
        // Update status to SENT only if email actually sent
        await prisma.invite.update({
          where: { invite_id: invite.invite_id },
          data: { status: "SENT", sent_at: new Date() }
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

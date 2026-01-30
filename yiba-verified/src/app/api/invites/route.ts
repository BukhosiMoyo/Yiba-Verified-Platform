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

    // Generate invite link (in production, this would be sent via email)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/invite?token=${rawToken}`;

    return ok({
      ...invite,
      invite_link: inviteLink,
    });
  } catch (error) {
    return fail(error);
  }
}

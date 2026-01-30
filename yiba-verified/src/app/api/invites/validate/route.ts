// GET /api/invites/validate?token=... - Validate an invite token

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { createHash } from "crypto";

/**
 * GET /api/invites/validate
 * Validates an invite token and returns invite metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Token is required",
        400
      );
    }

    // Hash the token to look it up
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Find invite
    const invite = await prisma.invite.findUnique({
      where: {
        token_hash: tokenHash,
        deleted_at: null,
      },
      select: {
        invite_id: true,
        email: true,
        role: true,
        institution_id: true,
        expires_at: true,
        used_at: true,
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
      },
    });

    if (!invite) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Invalid invite token",
        404
      );
    }

    // Check if already used
    if (invite.used_at) {
      return ok({
        valid: false,
        reason: "already_used",
        invite: {
          email: invite.email,
          role: invite.role,
        },
      });
    }

    // Check if expired
    if (new Date() > invite.expires_at) {
      return ok({
        valid: false,
        reason: "expired",
        invite: {
          email: invite.email,
          role: invite.role,
          expires_at: invite.expires_at,
        },
      });
    }

    // Check if invitee already has an account (existing user → login + link)
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email, deleted_at: null },
      select: { user_id: true },
    });

    // Valid invite
    return ok({
      valid: true,
      existing_user: !!existingUser,
      invite: {
        email: invite.email,
        role: invite.role,
        institution_id: invite.institution_id,
        institution: invite.institution,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

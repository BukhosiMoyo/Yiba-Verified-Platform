// POST /api/invites/decline - Decline an invite (optional reason)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { createHash } from "crypto";

const VALID_DECLINE_REASONS = [
  "already_using_other_platform",
  "not_responsible",
  "not_interested",
  "other",
] as const;

/**
 * POST /api/invites/decline
 * Body: { token: string, reason?: string, reason_other?: string }
 * Marks invite as DECLINED and stores optional feedback.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.token;
    const reason = body.reason;
    const reasonOther = body.reason_other;

    if (!token || typeof token !== "string") {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Token is required", 400);
    }

    if (reason != null && !VALID_DECLINE_REASONS.includes(reason)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid reason. Must be one of: ${VALID_DECLINE_REASONS.join(", ")}`,
        400
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const invite = await prisma.invite.findUnique({
      where: {
        token_hash: tokenHash,
        deleted_at: null,
      },
    });

    if (!invite) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Invalid invite token", 404);
    }

    if (invite.used_at || invite.accepted_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "This invite has already been used",
        400
      );
    }

    if (invite.declined_at) {
      return ok({ success: true, message: "Invite already declined" });
    }

    if (new Date() > invite.expires_at) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "This invite has expired", 400);
    }

    await prisma.invite.update({
      where: { invite_id: invite.invite_id },
      data: {
        status: "DECLINED",
        declined_at: new Date(),
        decline_reason: reason ?? null,
        decline_reason_other: reasonOther ?? null,
      },
    });

    return ok({ success: true, message: "Invite declined" });
  } catch (error) {
    return fail(error);
  }
}

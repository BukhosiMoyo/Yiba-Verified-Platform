// POST /api/institution/invites/[inviteId]/resend - Resend an invite (INSTITUTION_ADMIN only, own institution)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { processInvite } from "@/lib/invites/queue";
import type { QueueConfig } from "@/lib/invites/queue";

/**
 * POST /api/institution/invites/[inviteId]/resend
 * Resends an invite email. INSTITUTION_ADMIN only; invite must belong to their institution.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);

    if (ctx.role !== "INSTITUTION_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only INSTITUTION_ADMIN can resend invites",
        403
      );
    }

    if (!ctx.institutionId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "User must be associated with an institution",
        400
      );
    }

    const { inviteId } = await params;

    const invite = await prisma.invite.findFirst({
      where: {
        invite_id: inviteId,
        institution_id: ctx.institutionId,
        deleted_at: null,
      },
      include: {
        createdBy: { select: { first_name: true, last_name: true } },
        institution: { select: { trading_name: true, legal_name: true } },
      },
    });

    if (!invite) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Invite not found", 404);
    }

    if (new Date() > invite.expires_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Cannot resend expired invite",
        400
      );
    }

    if (invite.used_at || invite.accepted_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Cannot resend a used invite",
        400
      );
    }

    await prisma.invite.update({
      where: { invite_id: inviteId },
      data: {
        status: "QUEUED",
        attempts: 0,
        retry_count: 0,
        failure_reason: null,
        next_retry_at: null,
        declined_at: null,
        decline_reason: null,
        decline_reason_other: null,
      },
    });

    const config: QueueConfig = {
      batchSize: 1,
      batchDelayMs: 0,
      retryDelayMs: 300000,
      maxAttempts: 3,
    };
    const result = await processInvite(invite, config);

    if (!result.success) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        result.error || "Failed to resend invite",
        500
      );
    }

    return ok({ success: true, message: "Invite sent" });
  } catch (error) {
    return fail(error);
  }
}

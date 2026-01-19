// POST /api/platform-admin/invites/[inviteId]/resend - Resend an invite

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getRawToken } from "@/lib/invites/token-store";
import { processInvite } from "@/lib/invites/queue";
import type { QueueConfig } from "@/lib/invites/queue";

/**
 * POST /api/platform-admin/invites/[inviteId]/resend
 * Resends an invite email.
 * 
 * RBAC: PLATFORM_ADMIN only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Only PLATFORM_ADMIN
    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can resend invites",
        403
      );
    }

    const { inviteId } = await params;

    // Find invite
    const invite = await prisma.invite.findUnique({
      where: { invite_id: inviteId },
      include: {
        institution: {
          select: {
            trading_name: true,
            legal_name: true,
          },
        },
      },
    });

    if (!invite || invite.deleted_at) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Invite not found", 404);
    }

    // Check if invite is expired
    if (new Date() > invite.expires_at) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Cannot resend expired invite",
        400
      );
    }

    // Reset invite to QUEUED status for resending
    await prisma.invite.update({
      where: { invite_id: inviteId },
      data: {
        status: "QUEUED",
        attempts: 0,
        retry_count: 0,
        failure_reason: null,
        next_retry_at: null,
      },
    });

    // Process the invite immediately
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

    return ok({
      success: true,
      message: "Invite queued for resending",
    });
  } catch (error) {
    return fail(error);
  }
}

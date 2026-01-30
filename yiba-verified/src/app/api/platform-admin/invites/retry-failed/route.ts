// POST /api/platform-admin/invites/retry-failed - Requeue failed invites (PLATFORM_ADMIN only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * POST /api/platform-admin/invites/retry-failed
 * Sets all invites with status FAILED (and optionally RETRYING) back to QUEUED so they are resent.
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can retry failed invites",
        403
      );
    }

    const result = await prisma.invite.updateMany({
      where: {
        status: "FAILED",
        deleted_at: null,
        expires_at: { gt: new Date() },
      },
      data: {
        status: "QUEUED",
        failure_reason: null,
        next_retry_at: null,
      },
    });

    return ok({
      message: "Failed invites queued for retry",
      count: result.count,
    });
  } catch (error) {
    return fail(error);
  }
}

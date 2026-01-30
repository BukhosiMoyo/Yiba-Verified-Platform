// POST /api/invites/track/view - Track when invitee lands on Invite Review page

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { createHash } from "crypto";

/**
 * POST /api/invites/track/view
 * Body: { token: string }
 * Sets viewed_at on the invite when the invitee lands on the Invite Review page.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.token;

    if (!token || typeof token !== "string") {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Token is required", 400);
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    await prisma.invite.updateMany({
      where: {
        token_hash: tokenHash,
        viewed_at: null,
        deleted_at: null,
        status: { in: ["SENT", "DELIVERED", "OPENED"] },
      },
      data: {
        viewed_at: new Date(),
      },
    });

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}

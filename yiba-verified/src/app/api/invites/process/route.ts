// POST /api/invites/process - Process invite queue (background job trigger)

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { processInviteBatch } from "@/lib/invites/queue";

/**
 * POST /api/invites/process
 * Processes a batch of queued invites.
 * This should be called periodically by a cron job or background worker.
 * 
 * RBAC: PLATFORM_ADMIN only (or system service)
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Only PLATFORM_ADMIN or allow system calls
    // In production, you might want to use a service token instead
    if (ctx.role !== "PLATFORM_ADMIN") {
      // Check for service token in headers
      const serviceToken = request.headers.get("X-Service-Token");
      if (serviceToken !== process.env.INVITE_SERVICE_TOKEN) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only PLATFORM_ADMIN or service can process invites",
          403
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const batchSize = body.batchSize || parseInt(process.env.INVITE_BATCH_SIZE || "20", 10);

    // Process one batch
    const result = await processInviteBatch(batchSize);

    return ok({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return fail(error);
  }
}

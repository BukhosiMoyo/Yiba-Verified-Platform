// GET /api/platform-admin/email-logs - Email sending logs from invites (PLATFORM_ADMIN only)

import { NextRequest } from "next/server";
import type { InviteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/platform-admin/email-logs
 * Returns recent invite email send attempts (sent / failed) for the Email Settings logs table.
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can access email logs",
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));
    const statusFilter = searchParams.get("status"); // "sent" | "failed" | "all"

    const where: { status?: { in: InviteStatus[] }; deleted_at?: null } = {};
    if (statusFilter === "sent") {
      where.status = { in: ["SENT", "DELIVERED", "OPENED", "ACCEPTED"] as InviteStatus[] };
    } else if (statusFilter === "failed") {
      where.status = { in: ["FAILED", "RETRYING"] as InviteStatus[] };
    }
    // "all" or missing = no filter

    const [items, total] = await Promise.all([
      prisma.invite.findMany({
        where: { ...where, deleted_at: null },
        select: {
          invite_id: true,
          email: true,
          status: true,
          sent_at: true,
          failure_reason: true,
          last_attempt_at: true,
          updated_at: true,
        },
        orderBy: { updated_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.invite.count({ where: { ...where, deleted_at: null } }),
    ]);

    // Map to log shape (subject not on Invite - use placeholder for display)
    const logs = items.map((inv) => ({
      id: inv.invite_id,
      to_email: inv.email,
      status: inv.status,
      sent_at: inv.sent_at ?? inv.last_attempt_at ?? inv.updated_at,
      failure_reason: inv.failure_reason ?? null,
      updated_at: inv.updated_at,
    }));

    return ok({ items: logs, total });
  } catch (error) {
    return fail(error);
  }
}

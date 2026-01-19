// GET /api/platform-admin/invites - List invites (PLATFORM_ADMIN only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/platform-admin/invites
 * Lists all invites (PLATFORM_ADMIN only).
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Only PLATFORM_ADMIN
    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can access this endpoint",
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const statusFilter = searchParams.get("status"); // "pending", "used", "expired"

    const limit = Math.min(limitParam ? parseInt(limitParam, 10) : 50, 200);
    const offset = Math.max(0, offsetParam ? parseInt(offsetParam, 10) : 0);

    // Build where clause
    const where: any = {
      deleted_at: null,
    };

    // Map legacy status filters to new status system
    if (statusFilter === "pending") {
      where.status = { in: ["QUEUED", "SENDING", "SENT"] };
      where.expires_at = { gt: new Date() };
    } else if (statusFilter === "used") {
      where.status = "ACCEPTED";
    } else if (statusFilter === "expired") {
      where.status = "EXPIRED";
    } else if (statusFilter) {
      // Support new status values directly
      where.status = statusFilter;
    }

    // Get total count
    const total = await prisma.invite.count({ where });

    // Query invites
    const invites = await prisma.invite.findMany({
      where,
      select: {
        invite_id: true,
        email: true,
        role: true,
        institution_id: true,
        expires_at: true,
        used_at: true,
        created_at: true,
        status: true,
        attempts: true,
        last_attempt_at: true,
        sent_at: true,
        opened_at: true,
        clicked_at: true,
        accepted_at: true,
        failure_reason: true,
        retry_count: true,
        next_retry_at: true,
        batch_id: true,
        createdBy: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    });

    return ok({
      count: invites.length,
      total,
      items: invites,
    });
  } catch (error) {
    return fail(error);
  }
}

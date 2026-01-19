// GET /api/institution/invites - List invites (INSTITUTION_ADMIN only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/institution/invites
 * Lists invites for the current institution (INSTITUTION_ADMIN only).
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Only INSTITUTION_ADMIN
    if (ctx.role !== "INSTITUTION_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only INSTITUTION_ADMIN can access this endpoint",
        403
      );
    }

    if (!ctx.institution_id) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "User must be associated with an institution",
        400
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const statusFilter = searchParams.get("status");

    const limit = Math.min(limitParam ? parseInt(limitParam, 10) : 50, 200);
    const offset = Math.max(0, offsetParam ? parseInt(offsetParam, 10) : 0);

    // Build where clause - only invites for this institution
    const where: any = {
      deleted_at: null,
      institution_id: ctx.institution_id,
    };

    if (statusFilter === "pending") {
      where.used_at = null;
      where.expires_at = { gt: new Date() };
    } else if (statusFilter === "used") {
      where.used_at = { not: null };
    } else if (statusFilter === "expired") {
      where.used_at = null;
      where.expires_at = { lte: new Date() };
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
        createdBy: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
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

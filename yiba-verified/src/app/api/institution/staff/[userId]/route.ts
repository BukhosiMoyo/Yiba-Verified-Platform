// PATCH /api/institution/staff/[userId] - Update staff status (enable/disable)
// INSTITUTION_ADMIN only; user must belong to the same institution.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);

    if (ctx.role !== "INSTITUTION_ADMIN") {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only INSTITUTION_ADMIN can update staff status", 403);
    }

    if (!ctx.institutionId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "User must be associated with an institution", 400);
    }

    const { userId } = await params;

    if (userId === ctx.userId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "You cannot change your own status", 400);
    }

    const target = await prisma.user.findFirst({
      where: {
        user_id: userId,
        institution_id: ctx.institutionId,
        deleted_at: null,
      },
    });

    if (!target) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found in your institution", 404);
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !["ACTIVE", "INACTIVE"].includes(String(status))) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "status must be ACTIVE or INACTIVE", 400);
    }

    const updated = await prisma.user.update({
      where: { user_id: userId },
      data: { status: String(status) },
    });

    return ok({ user_id: updated.user_id, status: updated.status });
  } catch (error) {
    return fail(error);
  }
}

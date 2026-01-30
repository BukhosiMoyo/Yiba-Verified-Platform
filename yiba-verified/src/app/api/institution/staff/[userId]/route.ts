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
        deleted_at: null,
        OR: [
          { institution_id: ctx.institutionId },
          { userInstitutions: { some: { institution_id: ctx.institutionId } } },
        ],
      },
    });

    if (!target) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found in your institution", 404);
    }

    const body = await request.json();
    const { status, can_facilitate, can_assess, can_moderate } = body;

    const userUpdate: { status?: string } = {};
    if (status !== undefined) {
      if (!["ACTIVE", "INACTIVE"].includes(String(status))) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "status must be ACTIVE or INACTIVE", 400);
      }
      userUpdate.status = String(status);
    }

    const ui = await prisma.userInstitution.findUnique({
      where: {
        user_id_institution_id: { user_id: userId, institution_id: ctx.institutionId },
      },
    });

    if (!ui) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User is not a member of your institution", 404);
    }

    const institutionUpdate: { can_facilitate?: boolean; can_assess?: boolean; can_moderate?: boolean } = {};
    if (typeof can_facilitate === "boolean") institutionUpdate.can_facilitate = can_facilitate;
    if (typeof can_assess === "boolean") institutionUpdate.can_assess = can_assess;
    if (typeof can_moderate === "boolean") institutionUpdate.can_moderate = can_moderate;

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { user_id: userId },
        data: userUpdate,
      });
    }
    if (Object.keys(institutionUpdate).length > 0) {
      await prisma.userInstitution.update({
        where: { user_id_institution_id: { user_id: userId, institution_id: ctx.institutionId } },
        data: institutionUpdate,
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_id: true, status: true },
    });
    const updatedUi = await prisma.userInstitution.findUnique({
      where: { user_id_institution_id: { user_id: userId, institution_id: ctx.institutionId } },
      select: { can_facilitate: true, can_assess: true, can_moderate: true },
    });

    return ok({
      user_id: updatedUser?.user_id ?? userId,
      status: updatedUser?.status,
      can_facilitate: updatedUi?.can_facilitate,
      can_assess: updatedUi?.can_assess,
      can_moderate: updatedUi?.can_moderate,
    });
  } catch (error) {
    return fail(error);
  }
}

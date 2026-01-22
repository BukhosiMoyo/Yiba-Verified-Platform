// PATCH /api/platform-admin/users/[userId]/provinces - Update user province assignments (PLATFORM_ADMIN only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { validateProvinceAssignment, isValidProvince } from "@/lib/security/validation";
import { PROVINCES } from "@/lib/provinces";

/**
 * PATCH /api/platform-admin/users/[userId]/provinces
 * Updates province assignments for a user (PLATFORM_ADMIN only).
 * 
 * Body:
 * - default_province: string | null (required)
 * - assigned_provinces: string[] (required)
 * 
 * Rules:
 * - default_province must be in assigned_provinces array
 * - All provinces must be valid
 * - QCTO roles (except QCTO_SUPER_ADMIN) require default_province
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { userId } = await params;

    // RBAC: Only PLATFORM_ADMIN
    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can update province assignments",
        403
      );
    }

    const body = await request.json();
    const { default_province, assigned_provinces } = body;

    if (default_province === undefined || assigned_provinces === undefined) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "default_province and assigned_provinces are required",
        400
      );
    }

    // Validate assigned_provinces is an array
    if (!Array.isArray(assigned_provinces)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "assigned_provinces must be an array",
        400
      );
    }

    // Validate all provinces are valid
    for (const province of assigned_provinces) {
      if (!isValidProvince(province)) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Invalid province: ${province}. Must be one of: ${PROVINCES.join(", ")}`,
          400
        );
      }
    }

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { user_id: userId, deleted_at: null },
      select: { role: true },
    });

    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    // Validate province assignment based on role
    validateProvinceAssignment(user.role, default_province, assigned_provinces);

    // Update user
    const updated = await prisma.user.update({
      where: { user_id: userId },
      data: {
        default_province,
        assigned_provinces,
      },
    });

    return ok({
      user_id: updated.user_id,
      default_province: updated.default_province,
      assigned_provinces: updated.assigned_provinces,
    });
  } catch (error) {
    return fail(error);
  }
}

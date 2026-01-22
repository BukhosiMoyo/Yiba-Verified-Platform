// GET /api/platform-admin/users/[userId] - Get user details (PLATFORM_ADMIN only)
// PATCH /api/platform-admin/users/[userId] - Update user (PLATFORM_ADMIN only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { validateProvinceAssignment } from "@/lib/security/validation";

/**
 * GET /api/platform-admin/users/[userId]
 * Gets a single user by ID with all related data (PLATFORM_ADMIN only).
 */
export async function GET(
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
        "Only PLATFORM_ADMIN can access this endpoint",
        403
      );
    }

    // Query user with all related data based on role
    const user = await prisma.user.findUnique({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      select: {
        user_id: true,
        institution_id: true,
        role: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        status: true,
        default_province: true,
        assigned_provinces: true,
        created_at: true,
        updated_at: true,
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
            status: true,
          },
        },
        // QCTO-specific data
        requestedQCTORequests: {
          where: { deleted_at: null },
          select: {
            request_id: true,
            institution_id: true,
            request_type: true,
            title: true,
            status: true,
            requested_at: true,
            reviewed_at: true,
            institution: {
              select: {
                institution_id: true,
                legal_name: true,
                trading_name: true,
              },
            },
          },
          orderBy: { requested_at: "desc" },
          take: 50,
        },
        reviewedQCTORequests: {
          where: { deleted_at: null },
          select: {
            request_id: true,
            institution_id: true,
            request_type: true,
            title: true,
            status: true,
            reviewed_at: true,
            institution: {
              select: {
                institution_id: true,
                legal_name: true,
                trading_name: true,
              },
            },
          },
          orderBy: { reviewed_at: "desc" },
          take: 50,
        },
        reviewedSubmissions: {
          where: { deleted_at: null },
          select: {
            submission_id: true,
            institution_id: true,
            status: true,
            submitted_at: true,
            reviewed_at: true,
            institution: {
              select: {
                institution_id: true,
                legal_name: true,
                trading_name: true,
              },
            },
          },
          orderBy: { reviewed_at: "desc" },
          take: 50,
        },
        addedResources: {
          select: {
            resource_id: true,
            submission_id: true,
            resource_type: true,
            added_at: true,
            submission: {
              select: {
                submission_id: true,
                institution_id: true,
                status: true,
                institution: {
                  select: {
                    legal_name: true,
                    trading_name: true,
                  },
                },
              },
            },
          },
          orderBy: { added_at: "desc" },
          take: 50,
        },
        _count: {
          select: {
            requestedQCTORequests: true,
            reviewedQCTORequests: true,
            reviewedSubmissions: true,
            addedResources: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "User not found",
        404
      );
    }

    return ok({ user });
  } catch (error) {
    return fail(error);
  }
}

/**
 * PATCH /api/platform-admin/users/[userId]
 * Updates a user (PLATFORM_ADMIN only).
 * Can update: status, role, default_province, assigned_provinces
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
        "Only PLATFORM_ADMIN can access this endpoint",
        403
      );
    }

    const body = await request.json();
    const { status, role, default_province, assigned_provinces } = body;

    // Get current user to validate role changes
    const currentUser = await prisma.user.findUnique({
      where: { user_id: userId, deleted_at: null },
      select: { role: true, default_province: true, assigned_provinces: true },
    });

    if (!currentUser) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    const newRole = role || currentUser.role;
    const newDefaultProvince = default_province !== undefined ? default_province : currentUser.default_province;
    const newAssignedProvinces = assigned_provinces !== undefined ? assigned_provinces : currentUser.assigned_provinces;

    // Validate province assignment if role or provinces are being updated
    if (role !== undefined || default_province !== undefined || assigned_provinces !== undefined) {
      validateProvinceAssignment(newRole, newDefaultProvince, newAssignedProvinces);
    }

    const updateData: any = {};
    if (status !== undefined) {
      if (!["ACTIVE", "INACTIVE"].includes(String(status))) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid status", 400);
      }
      updateData.status = String(status);
    }
    if (role !== undefined) {
      updateData.role = role;
    }
    if (default_province !== undefined) {
      updateData.default_province = default_province;
    }
    if (assigned_provinces !== undefined) {
      updateData.assigned_provinces = assigned_provinces;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Provide at least one field to update", 400);
    }

    const updated = await prisma.user.update({
      where: { user_id: userId },
      data: updateData,
    });

    return ok({
      user_id: updated.user_id,
      status: updated.status,
      role: updated.role,
      default_province: updated.default_province,
      assigned_provinces: updated.assigned_provinces,
    });
  } catch (error) {
    return fail(error);
  }
}

// PATCH /api/qcto/team/[userId] - Update QCTO member status or role (requires QCTO_TEAM_MANAGE)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";
import { validateProvinceAssignment } from "@/lib/security/validation";

const QCTO_ROLES = [
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "QCTO_REVIEWER",
  "QCTO_AUDITOR",
  "QCTO_VIEWER",
] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);

    if (!hasCap(ctx.role, "QCTO_TEAM_MANAGE")) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "QCTO_TEAM_MANAGE capability required", 403);
    }

    let qctoId = ctx.qctoId;
    if (!qctoId && ctx.role === "PLATFORM_ADMIN") {
      const org = await prisma.qCTOOrg.findFirst();
      if (org) qctoId = org.id;
    }
    if (!qctoId) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "No QCTO organisation access", 403);
    }

    const { userId } = await params;
    if (userId === ctx.userId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "You cannot change your own status or role", 400);
    }

    const target = await prisma.user.findFirst({
      where: { user_id: userId, qcto_id: qctoId, deleted_at: null },
    });
    if (!target) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found in your QCTO team", 404);
    }

    const body = await request.json();
    const { status, role, default_province, assigned_provinces } = body;

    // Get current user to validate province assignment
    const currentUser = await prisma.user.findFirst({
      where: { user_id: userId, qcto_id: qctoId, deleted_at: null },
      select: { role: true, default_province: true, assigned_provinces: true },
    });

    if (!currentUser) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found in your QCTO team", 404);
    }

    const newRole = role || currentUser.role;
    const newDefaultProvince = default_province !== undefined ? default_province : currentUser.default_province;
    const newAssignedProvinces = assigned_provinces !== undefined ? assigned_provinces : currentUser.assigned_provinces;

    // Validate province assignment if role or provinces are being updated
    if (role !== undefined || default_province !== undefined || assigned_provinces !== undefined) {
      validateProvinceAssignment(newRole, newDefaultProvince, newAssignedProvinces);
    }

    const data: { 
      status?: string; 
      role?: (typeof QCTO_ROLES)[number];
      default_province?: string | null;
      assigned_provinces?: string[];
    } = {};
    
    if (status !== undefined) {
      if (!["ACTIVE", "INACTIVE"].includes(String(status))) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid status", 400);
      }
      data.status = String(status);
    }
    if (role !== undefined) {
      if (!QCTO_ROLES.includes(role as (typeof QCTO_ROLES)[number])) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid role", 400);
      }
      data.role = role as (typeof QCTO_ROLES)[number];
    }
    if (default_province !== undefined) {
      data.default_province = default_province;
    }
    if (assigned_provinces !== undefined) {
      data.assigned_provinces = assigned_provinces;
    }

    if (Object.keys(data).length === 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Provide status, role, or province assignment to update", 400);
    }

    const updated = await prisma.user.update({
      where: { user_id: userId },
      data,
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

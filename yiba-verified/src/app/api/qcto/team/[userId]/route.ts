// GET /api/qcto/team/[userId] - Get QCTO team member details
// PATCH /api/qcto/team/[userId] - Update QCTO member (requires QCTO_SUPER_ADMIN for full access)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";
import { validateProvinceAssignment } from "@/lib/security/validation";
import { hashPassword } from "@/lib/password";

const QCTO_ROLES = [
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "QCTO_REVIEWER",
  "QCTO_AUDITOR",
  "QCTO_VIEWER",
] as const;

export async function GET(
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

    const user = await prisma.user.findFirst({
      where: { user_id: userId, qcto_id: qctoId, deleted_at: null },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        default_province: true,
        assigned_provinces: true,
        created_at: true,
        updated_at: true,
        image: true,
      },
    });

    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found in your QCTO team", 404);
    }

    return ok({ user });
  } catch (error) {
    return fail(error);
  }
}

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

    const body = await request.json();
    const { status, role, default_province, assigned_provinces, first_name, last_name, email, phone, password } = body;

    // Prevent self-modification of status/role (but Super Admin can edit their own details)
    if (userId === ctx.userId && ctx.role !== "QCTO_SUPER_ADMIN") {
      if (status !== undefined || role !== undefined) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "You cannot change your own status or role", 400);
      }
    }

    const target = await prisma.user.findFirst({
      where: { user_id: userId, qcto_id: qctoId, deleted_at: null },
    });
    if (!target) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found in your QCTO team", 404);
    }
    
    // Only QCTO_SUPER_ADMIN can edit user details and change passwords
    const isSuperAdmin = ctx.role === "QCTO_SUPER_ADMIN";
    
    if (!isSuperAdmin && (first_name !== undefined || last_name !== undefined || email !== undefined || phone !== undefined || password !== undefined)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO Super Admin can edit user details and change passwords", 403);
    }

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
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string | null;
      password_hash?: string;
    } = {};
    
    // Super Admin can edit user details
    if (isSuperAdmin) {
      if (first_name !== undefined) {
        if (!first_name.trim()) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, "First name is required", 400);
        }
        data.first_name = first_name.trim();
      }
      if (last_name !== undefined) {
        if (!last_name.trim()) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Last name is required", 400);
        }
        data.last_name = last_name.trim();
      }
      if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email.trim())) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Valid email is required", 400);
        }
        // Check if email is already in use by another user
        const existingUser = await prisma.user.findFirst({
          where: {
            email: email.trim().toLowerCase(),
            user_id: { not: userId },
            deleted_at: null,
          },
        });
        if (existingUser) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Email already in use", 400);
        }
        data.email = email.trim().toLowerCase();
      }
      if (phone !== undefined) {
        data.phone = phone ? phone.trim() : null;
      }
      if (password !== undefined) {
        if (password.length < 8) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Password must be at least 8 characters", 400);
        }
        data.password_hash = await hashPassword(password);
      }
    }
    
    // All admins can update status, role, and provinces
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
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "No valid fields to update", 400);
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

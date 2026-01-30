// GET /api/platform-admin/users - List users (PLATFORM_ADMIN only)
// PATCH /api/platform-admin/users - Update user (PLATFORM_ADMIN only)
//
// Query params:
//   ?q=searchText - Search in email, first_name, last_name
//   ?role=UserRole - Filter by role
//   ?status=ACTIVE|INACTIVE - Filter by status
//   ?institution_id=uuid - Filter by institution
//   ?limit=number - Limit results (default: 50, max: 200)
//   ?offset=number - Offset for pagination
//
// Example:
//   curl -sS "http://localhost:3000/api/platform-admin/users?role=INSTITUTION_ADMIN" | jq

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { createAuditLogs, serializeValue } from "@/services/audit.service";

/**
 * GET /api/platform-admin/users
 * Lists users (PLATFORM_ADMIN only) with filtering and pagination.
 * 
 * RBAC: Only PLATFORM_ADMIN can access this endpoint.
 * 
 * Returns:
 * {
 *   "count": number,
 *   "total": number,
 *   "items": User[]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC: Only PLATFORM_ADMIN (uses original role when viewing as another user)
    const ctx = await requireRole(request, "PLATFORM_ADMIN");

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";
    const roleFilter = searchParams.get("role") || "";
    const statusFilter = searchParams.get("status") || "";
    const institutionId = searchParams.get("institution_id") || "";
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    
    const limit = Math.min(
      limitParam ? parseInt(limitParam, 10) : 50,
      200 // Cap at 200
    );
    const offset = Math.max(0, offsetParam ? parseInt(offsetParam, 10) : 0);

    if (isNaN(limit) || limit < 1) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid limit parameter (must be a positive number)",
        400
      );
    }

    if (isNaN(offset) || offset < 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid offset parameter (must be a non-negative number)",
        400
      );
    }

    // Build where clause
    const where: any = {
      deleted_at: null, // Only non-deleted users
    };

    // Add role filter
    if (roleFilter) {
      where.role = roleFilter;
    }

    // Add status filter
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Add institution filter
    if (institutionId) {
      where.institution_id = institutionId;
    }

    // Add search filter (allow 1+ character so search feels responsive)
    if (searchQuery.trim()) {
      where.OR = [
        { email: { contains: searchQuery.trim(), mode: "insensitive" } },
        { first_name: { contains: searchQuery.trim(), mode: "insensitive" } },
        { last_name: { contains: searchQuery.trim(), mode: "insensitive" } },
      ];
    }

    // Get total count (for pagination)
    const total = await prisma.user.count({ where });

    // Query users with institution info
    const users = await prisma.user.findMany({
      where,
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        phone: true,
        created_at: true,
        institution_id: true, // Include institution_id directly
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip: offset,
      take: limit,
    });

    return ok({
      count: users.length,
      total,
      items: users,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * PATCH /api/platform-admin/users
 * Updates a user (PLATFORM_ADMIN only).
 * 
 * RBAC: Only PLATFORM_ADMIN can access this endpoint.
 * 
 * Body:
 * {
 *   "user_id": string,
 *   "first_name"?: string,
 *   "last_name"?: string,
 *   "email"?: string,
 *   "phone"?: string,
 *   "role"?: UserRole,
 *   "status"?: "ACTIVE" | "INACTIVE",
 *   "institution_id"?: string | null
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // RBAC: Only PLATFORM_ADMIN (uses original role when viewing as another user)
    const ctx = await requireRole(request, "PLATFORM_ADMIN");

    const body = await request.json();
    const { user_id, ...updateData } = body;

    if (!user_id) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "user_id is required",
        400
      );
    }

    // Check if user exists and get all current values for comparison
    const existingUser = await prisma.user.findUnique({
      where: { user_id },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        status: true,
        institution_id: true,
        deleted_at: true,
      },
    });

    if (!existingUser || existingUser.deleted_at) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "User not found",
        404
      );
    }

    // Validate email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email },
      });
      if (emailExists) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Email already in use",
          400
        );
      }
    }

    // Validate institution_id if provided
    if (updateData.institution_id !== undefined) {
      if (updateData.institution_id) {
        const institution = await prisma.institution.findUnique({
          where: { institution_id: updateData.institution_id },
        });
        if (!institution || institution.deleted_at) {
          throw new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            "Institution not found",
            400
          );
        }
      }
    }

    // Update user with audit logging
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { user_id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        select: {
          user_id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          status: true,
          phone: true,
          created_at: true,
          institution_id: true,
          institution: {
            select: {
              institution_id: true,
              legal_name: true,
              trading_name: true,
            },
          },
        },
      });

      // Create audit logs for each changed field
      const auditEntries = [];
      for (const [field, newValue] of Object.entries(updateData)) {
        if (field === "updated_at") continue; // Skip timestamp
        
        const oldValue = existingUser[field as keyof typeof existingUser];
        
        // Normalize values for comparison - handle null, undefined, empty string, and whitespace
        const normalize = (val: any): string => {
          if (val === null || val === undefined) return "";
          if (typeof val === "string") return val.trim();
          return String(val).trim();
        };
        
        const normalizedOld = normalize(oldValue);
        const normalizedNew = normalize(newValue);
        
        // Only create audit log if values actually changed
        if (normalizedOld !== normalizedNew) {
          auditEntries.push({
            entityType: "USER" as const,
            entityId: user_id,
            fieldName: field,
            oldValue: serializeValue(oldValue ?? null),
            newValue: serializeValue(newValue ?? null),
            changedBy: ctx.userId,
            roleAtTime: ctx.role,
            changeType: field === "status" ? ("STATUS_CHANGE" as const) : ("UPDATE" as const),
            reason: null,
            institutionId: updated.institution_id,
          });
        }
      }

      if (auditEntries.length > 0) {
        await createAuditLogs(tx, auditEntries);
      }

      return updated;
    });

    return ok(updatedUser);
  } catch (error) {
    return fail(error);
  }
}

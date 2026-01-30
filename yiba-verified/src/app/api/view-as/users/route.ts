/**
 * GET /api/view-as/users
 * 
 * Get list of users that the current user can view as.
 * 
 * Security:
 * - Only privileged users can use this (PLATFORM_ADMIN, QCTO_SUPER_ADMIN, QCTO_ADMIN, INSTITUTION_ADMIN)
 * 
 * Returns:
 * {
 *   users: Array<{user_id, email, first_name, last_name, role, institution_id, qcto_id}>
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getEffectiveRoleForPermissions } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getViewableUsers } from "@/lib/viewAsUser";

/**
 * GET /api/view-as/users
 * Get list of users that can be viewed as
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // Check if user has permission to view as other users
    // Use effective role (original role when viewing as someone) for permission checks
    const effectiveRole = getEffectiveRoleForPermissions(ctx);
    const canViewAsRoles = [
      "PLATFORM_ADMIN",
      "QCTO_SUPER_ADMIN",
      "QCTO_ADMIN",
      "INSTITUTION_ADMIN",
    ];

    if (!canViewAsRoles.includes(effectiveRole)) {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "You do not have permission to view as other users",
          403
        )
      );
    }

    // Get viewable users (use original user ID if viewing as someone else)
    const viewerUserId = ctx.originalUserId || ctx.userId;
    const users = await getViewableUsers(viewerUserId);

    return NextResponse.json({
      users,
      count: users.length,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("GET /api/view-as/users error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to get viewable users", 500)
    );
  }
}

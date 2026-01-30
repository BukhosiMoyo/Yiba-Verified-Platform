/**
 * POST /api/view-as/stop
 * 
 * Stop viewing as another user and return to your own account.
 * 
 * Security:
 * - Only works if currently viewing as another user
 * 
 * Clears the viewing as user context from the NextAuth session.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { cookies } from "next/headers";
import type { Role } from "@/lib/rbac";

/**
 * POST /api/view-as/stop
 * Stop viewing as another user
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // Check if currently viewing as another user
    if (!ctx.viewingAsUserId) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Not currently viewing as another user",
          400
        )
      );
    }

    // Get original role before clearing cookies (for redirect)
    const originalRole = ctx.originalRole || ctx.role;

    // Clear viewing as cookies
    const cookieStore = await cookies();
    cookieStore.delete("viewing_as_user_id");
    cookieStore.delete("viewing_as_role");
    cookieStore.delete("viewing_as_institution_id");
    cookieStore.delete("viewing_as_qcto_id");

    // Get dashboard route for original role
    function getDashboardRoute(role: Role): string {
      if (role === "PLATFORM_ADMIN") return "/platform-admin";
      if (role.startsWith("QCTO_")) return "/qcto";
      if (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") return "/institution";
      if (role === "STUDENT") return "/student";
      return "/";
    }

    const dashboardRoute = getDashboardRoute(originalRole);

    return NextResponse.json({
      success: true,
      message: "Stopped viewing as another user",
      redirectTo: dashboardRoute,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/view-as/stop error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to stop viewing as user", 500)
    );
  }
}

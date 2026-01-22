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

    // Clear viewing as cookies
    const cookieStore = await cookies();
    cookieStore.delete("viewing_as_user_id");
    cookieStore.delete("viewing_as_role");
    cookieStore.delete("viewing_as_institution_id");
    cookieStore.delete("viewing_as_qcto_id");

    return NextResponse.json({
      success: true,
      message: "Stopped viewing as another user",
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

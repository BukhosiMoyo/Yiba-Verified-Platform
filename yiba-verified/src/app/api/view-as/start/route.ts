/**
 * POST /api/view-as/start
 * 
 * Start viewing as another user.
 * 
 * Body:
 * {
 *   targetUserId: string
 * }
 * 
 * Security:
 * - Only privileged users can use this (PLATFORM_ADMIN, QCTO_SUPER_ADMIN, QCTO_ADMIN, INSTITUTION_ADMIN)
 * - Must pass canViewAsUser check
 * 
 * Updates the NextAuth session to include viewing as user context.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import {
  assertCanViewAsUser,
  getViewAsUserContext,
} from "@/lib/viewAsUser";
import { cookies } from "next/headers";

interface StartViewAsBody {
  targetUserId: string;
}

/**
 * POST /api/view-as/start
 * Start viewing as another user
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // Check if user has permission to view as other users
    const canViewAsRoles = [
      "PLATFORM_ADMIN",
      "QCTO_SUPER_ADMIN",
      "QCTO_ADMIN",
      "INSTITUTION_ADMIN",
    ];

    if (!canViewAsRoles.includes(ctx.role)) {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "You do not have permission to view as other users",
          403
        )
      );
    }

    const body: StartViewAsBody = await request.json();

    if (!body.targetUserId) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "targetUserId is required",
          400
        )
      );
    }

    // Check if viewer can view as target
    await assertCanViewAsUser(ctx.userId, body.targetUserId);

    // Get viewing as context
    const viewAsContext = await getViewAsUserContext(body.targetUserId);

    // Store viewing as state in a cookie (read by JWT callback)
    const cookieStore = await cookies();
    cookieStore.set("viewing_as_user_id", viewAsContext.viewingAsUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    cookieStore.set("viewing_as_role", viewAsContext.viewingAsRole, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });
    if (viewAsContext.viewingAsInstitutionId) {
      cookieStore.set(
        "viewing_as_institution_id",
        viewAsContext.viewingAsInstitutionId,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24,
        }
      );
    }
    if (viewAsContext.viewingAsQctoId) {
      cookieStore.set("viewing_as_qcto_id", viewAsContext.viewingAsQctoId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Now viewing as ${viewAsContext.viewingAsUserId}`,
      viewingAs: viewAsContext,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/view-as/start error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to start viewing as user", 500)
    );
  }
}

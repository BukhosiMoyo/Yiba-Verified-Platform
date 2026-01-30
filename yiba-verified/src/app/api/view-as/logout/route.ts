/**
 * POST /api/view-as/logout
 * 
 * End an active impersonation session.
 * Marks the session as COMPLETED.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { completeImpersonationSession, getDashboardRouteForRole } from "@/lib/impersonation";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/view-as/logout
 * End impersonation session
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // Check if this is an impersonation session
    const impersonationSessionId = ctx.impersonationSessionId;

    if (!impersonationSessionId) {
      // Not an impersonation session, nothing to do
      return NextResponse.json({
        success: true,
        message: "Not an impersonation session",
      });
    }

    // Get the session to find the impersonator
    const session = await prisma.impersonationSession.findUnique({
      where: { id: impersonationSessionId },
      include: {
        impersonator: {
          select: {
            user_id: true,
            role: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({
        success: true,
        message: "Session not found",
      });
    }

    // Complete the session
    await completeImpersonationSession(impersonationSessionId);

    // Get dashboard route for impersonator
    const impersonatorDashboard = getDashboardRouteForRole(session.impersonator.role);

    return NextResponse.json({
      success: true,
      message: "Impersonation session ended",
      redirectTo: impersonatorDashboard,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/view-as/logout error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to end impersonation session", 500)
    );
  }
}

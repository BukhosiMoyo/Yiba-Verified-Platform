/**
 * POST /api/view-as/generate-link
 * 
 * Generate an impersonation login link for a target user.
 * 
 * Body:
 * {
 *   targetUserId: string
 * }
 * 
 * Returns:
 * {
 *   token: string,
 *   link: string,
 *   fullUrl: string,
 *   expiresAt: string,
 *   expiresIn: number
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { appendFileSync } from "fs";
import { join } from "path";
import { requireAuth, getEffectiveRoleForPermissions } from "@/lib/api/context";

const DEBUG_LOG_PATH = "/Users/maxx/Projects/Yiba Verified/.cursor/debug.log";
function debugLog(payload: Record<string, unknown>) {
  try {
    appendFileSync(DEBUG_LOG_PATH, JSON.stringify({ ...payload, timestamp: Date.now() }) + "\n");
  } catch (_) {}
}
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import {
  createImpersonationSession,
  getDashboardRouteForRole,
} from "@/lib/impersonation";

interface GenerateLinkBody {
  targetUserId: string;
}

/**
 * POST /api/view-as/generate-link
 * Generate impersonation login link
 */
const CAN_IMPERSONATE_ROLES = [
  "PLATFORM_ADMIN",
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "INSTITUTION_ADMIN",
] as const;

export async function POST(request: NextRequest) {
  // #region agent log
  debugLog({
    location: "generate-link/route.ts:POST:entry",
    message: "POST handler entered",
    data: { hypothesisId: "H4" },
    sessionId: "debug-session",
    runId: "run1",
  });
  // #endregion
  try {
    const { ctx } = await requireAuth(request);
    const { prisma } = await import("@/lib/prisma");

    // #region agent log
    debugLog({
      location: "generate-link/route.ts:POST:after-requireAuth",
      message: "ctx after requireAuth",
      data: {
        userId: ctx.userId,
        originalUserId: ctx.originalUserId ?? null,
        role: ctx.role,
        originalRole: ctx.originalRole ?? null,
        hypothesisId: "H2,H4",
      },
      sessionId: "debug-session",
      runId: "run1",
    });
    // #endregion

    // Resolve the role of the actor (the user requesting the link) from DB when possible.
    // This avoids 403 when session/JWT has viewed-as role or originalRole is missing.
    const actorUserId = ctx.originalUserId ?? ctx.userId;
    const actor = await prisma.user.findUnique({
      where: { user_id: actorUserId },
      select: { role: true },
    });
    const roleForPermission = actor?.role ?? getEffectiveRoleForPermissions(ctx);
    const permissionDenied = !(CAN_IMPERSONATE_ROLES as readonly string[]).includes(roleForPermission);

    // #region agent log
    debugLog({
      location: "generate-link/route.ts:POST:after-db-resolve",
      message: "actor and permission check",
      data: {
        actorUserId,
        actorFound: !!actor,
        actorRole: actor?.role ?? null,
        roleForPermission,
        permissionDenied,
        hypothesisId: "H1,H3",
      },
      sessionId: "debug-session",
      runId: "run1",
    });
    // #endregion

    if (permissionDenied) {
      // #region agent log
      debugLog({
        location: "generate-link/route.ts:POST:returning-403",
        message: "permission denied 403",
        data: { roleForPermission, hypothesisId: "H1,H3" },
        sessionId: "debug-session",
        runId: "run1",
      });
      // #endregion
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "You do not have permission to impersonate users",
          403
        )
      );
    }

    const body: GenerateLinkBody = await request.json();

    if (!body.targetUserId) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "targetUserId is required",
          400
        )
      );
    }

    // Use original user ID for impersonation (not viewing-as user ID)
    const impersonatorUserId = ctx.originalUserId || ctx.userId;

    // Get IP address and user agent for audit trail
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Create impersonation session
    const session = await createImpersonationSession(
      impersonatorUserId,
      body.targetUserId,
      ipAddress,
      userAgent
    );

    // Build the impersonation link
    const baseUrl = process.env.NEXTAUTH_URL || 
                   request.headers.get("origin") || 
                   "http://localhost:3000";
    const link = `/view-as/${session.token}`;
    const fullUrl = `${baseUrl}${link}`;

    return NextResponse.json({
      token: session.token,
      link,
      fullUrl,
      expiresAt: session.expires_at.toISOString(),
      expiresIn: Math.floor((session.expires_at.getTime() - Date.now()) / 1000),
    });
  } catch (error) {
    // #region agent log
    debugLog({
      location: "generate-link/route.ts:POST:catch",
      message: "caught error",
      data: {
        isAppError: error instanceof AppError,
        code: (error as any)?.code,
        hypothesisId: "H4",
      },
      sessionId: "debug-session",
      runId: "run1",
    });
    // #endregion
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/view-as/generate-link error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to generate impersonation link", 500)
    );
  }
}

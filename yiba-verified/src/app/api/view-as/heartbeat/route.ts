/**
 * POST /api/view-as/heartbeat
 * 
 * Update activity timestamp for an active impersonation session.
 * Called periodically to keep the session alive.
 * 
 * Body:
 * {
 *   sessionId: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { updateImpersonationActivity } from "@/lib/impersonation";
import { prisma } from "@/lib/prisma";

interface HeartbeatBody {
  sessionId?: string;
  token?: string; // Alternative: use token instead of sessionId
}

/**
 * POST /api/view-as/heartbeat
 * Update impersonation session activity
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // Check if this is an impersonation session
    const impersonationSessionId = (ctx as any).impersonationSessionId;
    if (!impersonationSessionId) {
      // Return 200 with active: false so clients don't log 400s when heartbeat is called without an active view-as session
      return NextResponse.json({ success: true, active: false });
    }

    const sessionId = impersonationSessionId;

    // Verify session exists and is active
    const session = await prisma.impersonationSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ success: true, active: false, reason: "not_found" });
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json({ success: true, active: false, reason: "inactive" });
    }

    // Check if expired
    if (session.expires_at < new Date()) {
      await prisma.impersonationSession.update({
        where: { id: sessionId },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ success: true, active: false, reason: "expired" });
    }

    // Update activity
    await updateImpersonationActivity(sessionId);

    // Get updated session with new last_activity
    const updatedSession = await prisma.impersonationSession.findUnique({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      expiresAt: session.expires_at.toISOString(),
      lastActivity: updatedSession?.last_activity.toISOString() || session.last_activity.toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/view-as/heartbeat error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to update activity", 500)
    );
  }
}

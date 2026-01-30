import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { logUserActivity, getClientIP } from "@/lib/activity-log";
import { ok, fail } from "@/lib/api/response";

/**
 * POST /api/account/activity/log
 * Log user activity (called after login)
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    const body = await request.json();
    const { activityType, success } = body;

    if (!activityType) {
      return NextResponse.json(
        { error: "activityType is required" },
        { status: 400 }
      );
    }

    // Get IP and user agent from headers
    const headersList = request.headers;
    const ipAddress = getClientIP(headersList);
    const userAgent = headersList.get("user-agent") || null;

    await logUserActivity({
      userId: ctx.userId,
      activityType: activityType as any,
      ipAddress,
      userAgent,
      success: success !== false, // Default to true unless explicitly false
    });

    return ok({ success: true });
  } catch (error) {
    return fail(error);
  }
}

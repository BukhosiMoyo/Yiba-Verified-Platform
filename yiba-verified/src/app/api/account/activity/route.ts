import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { getUserActivityLogs } from "@/lib/activity-log";
import { ok, fail } from "@/lib/api/response";

/**
 * GET /api/account/activity
 * Get user's activity logs (device info, IP, last logins)
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const activityType = searchParams.get("activity_type") || undefined;

    const result = await getUserActivityLogs({
      userId: ctx.userId,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
      activityType,
    });

    return ok({
      items: result.logs,
      total: result.total,
      count: result.count,
    });
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    console.error("Error details:", {
      code: error?.code,
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    
    // Provide more helpful error message if table doesn't exist
    if (error?.code === "P2021" || error?.code === "42P01" || error?.message?.includes("does not exist") || error?.message?.includes("Unknown model")) {
      console.warn("UserActivityLog table does not exist. Migration may not have been run.");
      // Return empty results instead of error
      return ok({
        items: [],
        total: 0,
        count: 0,
      });
    }
    return fail(error);
  }
}

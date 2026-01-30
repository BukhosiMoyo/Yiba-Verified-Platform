/**
 * User Activity Logging Utility
 * Tracks user login activity, device info, IP addresses, etc.
 */

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * Parse user agent string to extract device information
 */
export function parseUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown Device";

  const ua = userAgent.toLowerCase();

  // Browser detection
  let browser = "Unknown Browser";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  // OS detection
  let os = "Unknown OS";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  // Device type
  let deviceType = "Desktop";
  if (ua.includes("mobile")) deviceType = "Mobile";
  else if (ua.includes("tablet") || ua.includes("ipad")) deviceType = "Tablet";

  return `${browser} on ${os} (${deviceType})`;
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(headersList: Headers): string | null {
  // Check various headers for IP (common in proxy/load balancer setups)
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  const realIP = headersList.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = headersList.get("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  return null;
}

/**
 * Log user activity
 */
export async function logUserActivity(params: {
  userId: string;
  activityType: "LOGIN" | "LOGOUT" | "PASSWORD_CHANGE" | "PASSWORD_RESET" | "EMAIL_VERIFIED" | "ACCOUNT_LOCKED" | "ACCOUNT_UNLOCKED";
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  location?: string | null;
}) {
  try {
    const deviceInfo = parseUserAgent(params.userAgent || null);

    await prisma.userActivityLog.create({
      data: {
        user_id: params.userId,
        activity_type: params.activityType,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        device_info: deviceInfo,
        location: params.location || null,
        success: params.success ?? true,
      },
    });
  } catch (error: any) {
    // Don't throw - activity logging should not break the main flow
    // If table doesn't exist yet, just log a warning
    if (error?.code === "P2021" || error?.code === "42P01" || error?.message?.includes("does not exist")) {
      console.warn("UserActivityLog table does not exist yet. Run migration to enable activity logging.");
      return;
    }
    console.error("Failed to log user activity:", error);
  }
}

/**
 * Get user activity logs
 */
export async function getUserActivityLogs(params: {
  userId: string;
  limit?: number;
  offset?: number;
  activityType?: string;
}) {
  try {
    // Check if the model exists in Prisma client
    if (!prisma.userActivityLog) {
      console.warn("UserActivityLog model not found in Prisma client. Regenerate with: npx prisma generate");
      return {
        logs: [],
        total: 0,
        count: 0,
      };
    }

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const where: any = {
      user_id: params.userId,
    };

    if (params.activityType) {
      where.activity_type = params.activityType;
    }

    const [logs, total] = await Promise.all([
      prisma.userActivityLog.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.userActivityLog.count({ where }),
    ]);

    return {
      logs,
      total,
      count: logs.length,
    };
  } catch (error: any) {
    console.error("Error in getUserActivityLogs:", {
      code: error?.code,
      message: error?.message,
      name: error?.name,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // If table doesn't exist yet (migration not run), return empty results
    if (
      error?.code === "P2021" || 
      error?.code === "42P01" || 
      error?.code === "P2001" ||
      error?.code === "P2010" ||
      error?.message?.includes("does not exist") ||
      error?.message?.includes("Unknown model") ||
      error?.message?.includes("model UserActivityLog") ||
      error?.message?.includes("Cannot find model")
    ) {
      console.warn("UserActivityLog table does not exist yet. Run migration to enable activity logging.");
      return {
        logs: [],
        total: 0,
        count: 0,
      };
    }
    throw error;
  }
}

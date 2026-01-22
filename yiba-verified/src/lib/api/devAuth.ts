// Dev-only API token authentication
// Allows curl/testing without NextAuth session cookies
// ONLY active in development mode (NODE_ENV === "development")
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiContext } from "./context";
import { timingSafeEqual } from "crypto";

/**
 * Gets dev user context from X-DEV-TOKEN header.
 * ONLY works when NODE_ENV === "development" and DEV_API_TOKEN is set.
 * 
 * Returns null if:
 * - Not in development mode
 * - DEV_API_TOKEN is not set
 * - Token doesn't match
 * - User doesn't exist
 * 
 * @param req NextRequest with X-DEV-TOKEN header
 * @returns ApiContext or null
 */
export async function getDevUserFromRequest(
  req: NextRequest
): Promise<ApiContext | null> {
  // Only active in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Check if DEV_API_TOKEN is configured
  const devToken = process.env.DEV_API_TOKEN;
  if (!devToken) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[getDevUserFromRequest] DEV_API_TOKEN not set`);
    }
    return null;
  }

  // Get token from header (case-insensitive header name lookup)
  const headerToken = req.headers.get("X-DEV-TOKEN") || req.headers.get("x-dev-token");
  if (!headerToken) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[getDevUserFromRequest] X-DEV-TOKEN header not found`);
    }
    return null;
  }

  // Timing-safe comparison to prevent timing attacks
  // Both buffers must be the same length for timingSafeEqual
  const devTokenBuffer = Buffer.from(devToken, "utf8");
  const headerTokenBuffer = Buffer.from(headerToken, "utf8");
  
  if (devTokenBuffer.length !== headerTokenBuffer.length) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[getDevUserFromRequest] Token length mismatch: env=${devTokenBuffer.length}, header=${headerTokenBuffer.length}`);
    }
    return null;
  }
  
  if (!timingSafeEqual(devTokenBuffer, headerTokenBuffer)) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[getDevUserFromRequest] Token comparison failed`);
    }
    return null;
  }

  // Determine which user to use
  // Default: admin@yiba.local (PLATFORM_ADMIN)
  // Optional: DEV_API_USER_EMAIL env var
  const userEmail = process.env.DEV_API_USER_EMAIL || "admin@yiba.local";

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      user_id: true,
      role: true,
      institution_id: true,
      qcto_id: true,
    },
  });

  if (!user) {
    // User doesn't exist, return null (will fall back to normal auth)
    if (process.env.NODE_ENV === "development") {
      console.log(`[getDevUserFromRequest] User not found: ${userEmail}`);
    }
    return null;
  }

  return {
    userId: user.user_id,
    role: user.role,
    institutionId: user.institution_id,
    qctoId: user.qcto_id,
  };
}

/**
 * Requires dev token authentication (dev-only endpoint).
 * Does NOT fall back to NextAuth - this is for dev-token-only endpoints.
 * 
 * Returns ApiContext if valid dev token is present.
 * Throws UNAUTHENTICATED error if:
 * - Not in development mode (returns 404 via route handler)
 * - DEV_API_TOKEN not set
 * - Token missing or invalid
 * - User doesn't exist
 * 
 * @param req NextRequest with X-DEV-TOKEN header
 * @returns ApiContext
 * @throws Error with code "UNAUTHENTICATED" if auth fails
 */
export async function requireDevToken(req: NextRequest): Promise<ApiContext> {
  // Debug logging in development only (safe - no full token values)
  if (process.env.NODE_ENV === "development") {
    try {
      const url = new URL(req.url);
      const method = req.method;
      const headerToken = req.headers.get("X-DEV-TOKEN");
      const headerTokenPreview = headerToken ? `${headerToken.substring(0, 10)}... (len: ${headerToken.length})` : "NOT_PRESENT";
      const hasDevTokenEnv = !!process.env.DEV_API_TOKEN;
      const envTokenLen = process.env.DEV_API_TOKEN?.length || 0;
      const envTokenPreview = hasDevTokenEnv ? `***... (len: ${envTokenLen})` : "NOT_SET";
      
      console.log(`[requireDevToken] ${method} ${url.pathname}`);
      console.log(`[requireDevToken] X-DEV-TOKEN header: ${headerTokenPreview}`);
      console.log(`[requireDevToken] DEV_API_TOKEN env: ${envTokenPreview}`);
    } catch (err) {
      // Silently fail debug logging - don't break auth flow
    }
  }
  
  const ctx = await getDevUserFromRequest(req);
  
  if (!ctx) {
    // Debug logging for failure reasons in development only (safe - no token values)
    if (process.env.NODE_ENV === "development") {
      try {
        const url = new URL(req.url);
        const isDev = process.env.NODE_ENV === "development";
        const hasEnvToken = !!process.env.DEV_API_TOKEN;
        const hasHeaderToken = !!req.headers.get("X-DEV-TOKEN");
        
        console.log(`[requireDevToken] FAILED on ${url.pathname}:`);
        console.log(`[requireDevToken]   NODE_ENV === "development": ${isDev}`);
        console.log(`[requireDevToken]   DEV_API_TOKEN exists: ${hasEnvToken}`);
        console.log(`[requireDevToken]   X-DEV-TOKEN header present: ${hasHeaderToken}`);
      } catch (err) {
        // Silently fail debug logging
      }
    }
    
    const error = new Error("UNAUTHENTICATED");
    (error as any).code = "UNAUTHENTICATED";
    throw error;
  }
  
  if (process.env.NODE_ENV === "development") {
    try {
      console.log(`[requireDevToken] SUCCESS: role=${ctx.role}, userId=${ctx.userId.substring(0, 8)}...`);
    } catch (err) {
      // Silently fail debug logging
    }
  }
  
  return ctx;
}

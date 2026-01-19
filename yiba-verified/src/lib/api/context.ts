// API context utilities
// Provides authenticated context for API routes
import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/get-server-session";
import { getDevUserFromRequest } from "./devAuth";
import type { Role } from "@/lib/rbac";

export type ApiContext = {
  userId: string;
  role: Role;
  institutionId: string | null;
};

export type AuthResult = {
  ctx: ApiContext;
  authMode: "devtoken" | "nextauth";
};

/**
 * Shared authentication resolver for all API routes.
 * 
 * Authentication order:
 * 1. Dev token auth (X-DEV-TOKEN header) - ONLY in development (NODE_ENV === "development")
 * 2. NextAuth session (normal authentication)
 * 
 * In production, dev token is completely ignored and never works.
 * 
 * Returns both the context and the auth mode (for debug headers in development).
 * 
 * @param req NextRequest for authentication
 * @returns AuthResult with context and auth mode
 * @throws Error with code "UNAUTHENTICATED" if no valid authentication exists
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  // Try dev token auth first (development only)
  if (process.env.NODE_ENV === "development") {
    const devCtx = await getDevUserFromRequest(req);
    if (devCtx) {
      return {
        ctx: devCtx,
        authMode: "devtoken",
      };
    }
  }

  // Fall back to NextAuth session
  const session = await getServerSession();

  if (!session?.user) {
    const error = new Error("UNAUTHENTICATED");
    (error as any).code = "UNAUTHENTICATED";
    throw error;
  }

  return {
    ctx: {
      userId: session.user.userId,
      role: session.user.role,
      institutionId: session.user.institutionId,
    },
    authMode: "nextauth",
  };
}

/**
 * Requires an authenticated API context.
 * 
 * Authentication order (dev mode only):
 * 1. Dev token auth (X-DEV-TOKEN header) - if NODE_ENV === "development" and DEV_API_TOKEN is set
 * 2. NextAuth session (normal authentication)
 * 
 * Throws UNAUTHENTICATED error if no valid authentication exists.
 * 
 * @param req Optional NextRequest for dev token authentication
 * @deprecated Use requireAuth() instead for better consistency
 */
export async function requireApiContext(req?: NextRequest): Promise<ApiContext> {
  // Try dev token auth first (development only)
  if (req) {
    const devCtx = await getDevUserFromRequest(req);
    if (devCtx) {
      return devCtx;
    }
  }

  // Fall back to NextAuth session
  const session = await getServerSession();

  if (!session?.user) {
    const error = new Error("UNAUTHENTICATED");
    (error as any).code = "UNAUTHENTICATED";
    throw error;
  }

  return {
    userId: session.user.userId,
    role: session.user.role,
    institutionId: session.user.institutionId,
  };
}

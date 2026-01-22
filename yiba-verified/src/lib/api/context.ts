// API context utilities
// Provides authenticated context for API routes
import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/get-server-session";
import { getDevUserFromRequest } from "./devAuth";
import type { Role } from "@/lib/rbac";
import type { Capability } from "@/lib/capabilities";
import { hasCap } from "@/lib/capabilities";
import { AppError, ERROR_CODES } from "./errors";
import { cookies } from "next/headers";

export type ApiContext = {
  userId: string;
  role: Role;
  institutionId: string | null;
  qctoId: string | null;
  // View As User fields (when viewing as another user)
  viewingAsUserId?: string | null;
  viewingAsRole?: Role | null;
  viewingAsInstitutionId?: string | null;
  viewingAsQctoId?: string | null;
  // Original user context (for audit logging)
  originalUserId?: string;
  originalRole?: Role;
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

  // Check for View As User state in cookies (set by /api/view-as/start)
  const cookieStore = await cookies();
  const viewingAsUserId = cookieStore.get("viewing_as_user_id")?.value;
  const viewingAsRole = cookieStore.get("viewing_as_role")?.value as Role | undefined;
  const viewingAsInstitutionId = cookieStore.get("viewing_as_institution_id")?.value;
  const viewingAsQctoId = cookieStore.get("viewing_as_qcto_id")?.value;

  const isViewingAs = !!viewingAsUserId;

  return {
    ctx: {
      // Use viewing as user's context if present, otherwise use actual user's context
      userId: isViewingAs ? viewingAsUserId : session.user.userId,
      role: isViewingAs ? viewingAsRole! : session.user.role,
      institutionId: isViewingAs
        ? viewingAsInstitutionId ?? null
        : session.user.institutionId,
      qctoId: isViewingAs
        ? viewingAsQctoId ?? null
        : session.user.qctoId ?? null,
      // Store viewing as info
      viewingAsUserId: viewingAsUserId ?? null,
      viewingAsRole: viewingAsRole ?? null,
      viewingAsInstitutionId: viewingAsInstitutionId ?? null,
      viewingAsQctoId: viewingAsQctoId ?? null,
      // Store original user context for audit logging
      originalUserId: isViewingAs ? session.user.userId : undefined,
      originalRole: isViewingAs ? session.user.role : undefined,
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

  // Check for View As User state in cookies (set by /api/view-as/start)
  const cookieStore = await cookies();
  const viewingAsUserId = cookieStore.get("viewing_as_user_id")?.value;
  const viewingAsRole = cookieStore.get("viewing_as_role")?.value as Role | undefined;
  const viewingAsInstitutionId = cookieStore.get("viewing_as_institution_id")?.value;
  const viewingAsQctoId = cookieStore.get("viewing_as_qcto_id")?.value;

  const isViewingAs = !!viewingAsUserId;

  return {
    // Use viewing as user's context if present, otherwise use actual user's context
    userId: isViewingAs ? viewingAsUserId : session.user.userId,
    role: isViewingAs ? viewingAsRole! : session.user.role,
    institutionId: isViewingAs
      ? viewingAsInstitutionId ?? null
      : session.user.institutionId,
    qctoId: isViewingAs
      ? viewingAsQctoId ?? null
      : session.user.qctoId ?? null,
    // Store viewing as info
    viewingAsUserId: viewingAsUserId ?? null,
    viewingAsRole: viewingAsRole ?? null,
    viewingAsInstitutionId: viewingAsInstitutionId ?? null,
    viewingAsQctoId: viewingAsQctoId ?? null,
    // Store original user context for audit logging
    originalUserId: isViewingAs ? session.user.userId : undefined,
    originalRole: isViewingAs ? session.user.role : undefined,
  };
}

/**
 * Requires authentication and a specific capability (e.g. QCTO_TEAM_MANAGE).
 * Use on API routes that need capability-based access.
 * @throws AppError 403 if the user lacks the capability
 */
export async function requireCapability(req: NextRequest, cap: Capability): Promise<ApiContext> {
  const { ctx } = await requireAuth(req);
  if (!hasCap(ctx.role, cap)) {
    throw new AppError(ERROR_CODES.FORBIDDEN, `Capability required: ${cap}`, 403);
  }
  return ctx;
}

/**
 * Requires authentication and one of the given QCTO roles.
 * @throws AppError 403 if the user's role is not in the allowed list
 */
export async function requireQctoRole(req: NextRequest, allowedRoles: Role[]): Promise<ApiContext> {
  const { ctx } = await requireAuth(req);
  if (!allowedRoles.includes(ctx.role)) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient QCTO role", 403);
  }
  return ctx;
}

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
  /** All institution IDs the user can access (multi-institution). Set for INSTITUTION_ADMIN/INSTITUTION_STAFF. */
  institutionIds?: string[];
  qctoId: string | null;
  // View As User fields (deprecated - will be removed)
  viewingAsUserId?: string | null;
  viewingAsRole?: Role | null;
  viewingAsInstitutionId?: string | null;
  viewingAsQctoId?: string | null;
  // Original user context (for audit logging)
  originalUserId?: string;
  originalRole?: Role;
  // Impersonation fields
  impersonationSessionId?: string | null;
  impersonatorUserId?: string | null;
  impersonatorRole?: Role | null;
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

  // Ensure we have userId (JWT may use userId or id)
  const userId =
    (session.user as { userId?: string }).userId ??
    (session.user as { id?: string }).id;
  if (!userId) {
    const error = new Error("UNAUTHENTICATED");
    (error as any).code = "UNAUTHENTICATED";
    throw error;
  }

  // Check for impersonation session (new token-based system)
  const impersonationSessionId = session.user.impersonationSessionId;
  const impersonatorUserId = session.user.impersonatorUserId;
  const isImpersonating = !!impersonationSessionId;

  // Fetch impersonator's role if impersonating
  let impersonatorRole: Role | undefined = undefined;
  if (isImpersonating && impersonatorUserId) {
    const { prisma } = await import("@/lib/prisma");
    const impersonator = await prisma.user.findUnique({
      where: { user_id: impersonatorUserId },
      select: { role: true },
    });
    impersonatorRole = impersonator?.role ?? undefined;
  }

  // Check for View As User state in cookies (deprecated - old cookie-based system)
  const cookieStore = await cookies();
  const viewingAsUserId = cookieStore.get("viewing_as_user_id")?.value;
  const viewingAsRole = cookieStore.get("viewing_as_role")?.value as Role | undefined;
  const viewingAsInstitutionId = cookieStore.get("viewing_as_institution_id")?.value;
  const viewingAsQctoId = cookieStore.get("viewing_as_qcto_id")?.value;
  const isViewingAs = !!viewingAsUserId && !isImpersonating; // Don't use cookie-based if impersonating

  const role = session.user.role;
  let institutionId: string | null = session.user.institutionId ?? null;
  let institutionIds: string[] | undefined;

  // Multi-institution: resolve current institution from UserInstitution + cookie for institution roles
  if (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") {
    const { getCurrentInstitutionForUser } = await import("@/lib/currentInstitution");
    const preferredId = cookieStore.get("current_institution_id")?.value ?? null;
    const resolved = await getCurrentInstitutionForUser(userId, preferredId);
    institutionId = resolved.currentInstitutionId;
    institutionIds = resolved.institutionIds;
  }

  // For impersonation, the current user IS the target user (session is already set to target)
  // So we use the session user directly, but store the impersonator info
  return {
    ctx: {
      // Current user context (for impersonation, this is the target user)
      userId,
      role,
      institutionId,
      institutionIds,
      qctoId: session.user.qctoId,
      // Impersonation info
      impersonationSessionId: impersonationSessionId ?? null,
      impersonatorUserId: impersonatorUserId ?? null,
      impersonatorRole: impersonatorRole ?? null,
      // Original user context (for impersonation, this is the impersonator)
      originalUserId: isImpersonating ? (impersonatorUserId ?? undefined) : (isViewingAs ? userId : undefined),
      originalRole: isImpersonating ? impersonatorRole : (isViewingAs ? session.user.role : undefined),
      // View As User fields (deprecated - for backward compatibility)
      viewingAsUserId: isViewingAs ? viewingAsUserId : null,
      viewingAsRole: isViewingAs ? viewingAsRole ?? null : null,
      viewingAsInstitutionId: isViewingAs ? viewingAsInstitutionId ?? null : null,
      viewingAsQctoId: isViewingAs ? viewingAsQctoId ?? null : null,
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
 * Get the effective role for permission checks.
 * When viewing as another user, use the original user's role for permissions.
 * Otherwise, use the current user's role.
 */
export function getEffectiveRoleForPermissions(ctx: ApiContext): Role {
  // When viewing as another user, use original role for permission checks
  // This allows admins to maintain their permissions while viewing as other users
  return ctx.originalRole ?? ctx.role;
}

/**
 * Requires authentication and a specific capability (e.g. QCTO_TEAM_MANAGE).
 * Use on API routes that need capability-based access.
 * @throws AppError 403 if the user lacks the capability
 */
export async function requireCapability(req: NextRequest, cap: Capability): Promise<ApiContext> {
  const { ctx } = await requireAuth(req);
  const effectiveRole = getEffectiveRoleForPermissions(ctx);
  if (!hasCap(effectiveRole, cap)) {
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
  const effectiveRole = getEffectiveRoleForPermissions(ctx);
  if (!allowedRoles.includes(effectiveRole)) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient QCTO role", 403);
  }
  return ctx;
}

/**
 * Requires authentication and a specific role (e.g. PLATFORM_ADMIN).
 * Use on API routes that need role-based access.
 * @throws AppError 403 if the user doesn't have the required role
 */
export async function requireRole(req: NextRequest, requiredRole: Role): Promise<ApiContext> {
  const { ctx } = await requireAuth(req);
  const effectiveRole = getEffectiveRoleForPermissions(ctx);
  if (effectiveRole !== requiredRole) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      `Only ${requiredRole} can access this endpoint`,
      403
    );
  }
  return ctx;
}

/**
 * Requires authentication and one of the given roles.
 * Use on API routes that need role-based access with multiple allowed roles.
 * @throws AppError 403 if the user doesn't have one of the required roles
 */
export async function requireAnyRole(req: NextRequest, allowedRoles: Role[]): Promise<ApiContext> {
  const { ctx } = await requireAuth(req);
  const effectiveRole = getEffectiveRoleForPermissions(ctx);
  if (!allowedRoles.includes(effectiveRole)) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      `Only ${allowedRoles.join(" or ")} can access this endpoint`,
      403
    );
  }
  return ctx;
}

/**
 * Impersonation Utilities
 * 
 * Token-based impersonation system for admins to view as other users.
 * Similar to hosting company impersonation (cPanel, Plesk, etc.)
 */

import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { randomBytes } from "crypto";
import type { Role } from "@/lib/rbac";

export type ImpersonationStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "COMPLETED";

// Configuration
const TOKEN_EXPIRY_SECONDS = parseInt(process.env.IMPERSONATION_TOKEN_EXPIRY || "3600", 10); // 1 hour default
const INACTIVITY_TIMEOUT_SECONDS = parseInt(process.env.IMPERSONATION_INACTIVITY_TIMEOUT || "900", 10); // 15 minutes default
const MAX_ACTIVE_SESSIONS = parseInt(process.env.IMPERSONATION_MAX_ACTIVE_SESSIONS || "5", 10);

/**
 * Generate a secure random token for impersonation
 */
export function generateImpersonationToken(): string {
  // Generate 32 bytes (256 bits) of random data, encode as hex (64 characters)
  return randomBytes(32).toString("hex");
}

/**
 * Get dashboard route for a role
 */
export function getDashboardRouteForRole(role: Role): string {
  if (role === "PLATFORM_ADMIN") return "/platform-admin";
  if (role.startsWith("QCTO_")) return "/qcto";
  if (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") return "/institution";
  if (role === "STUDENT") return "/student";
  return "/";
}

/**
 * Check if a user can impersonate another user
 * Uses the same logic as canViewAsUser from viewAsUser.ts
 */
export async function canImpersonateUser(
  impersonatorUserId: string,
  targetUserId: string
): Promise<boolean> {
  // Can't impersonate yourself
  if (impersonatorUserId === targetUserId) {
    return false;
  }

  // Get both users
  const [impersonator, target] = await Promise.all([
    prisma.user.findUnique({
      where: { user_id: impersonatorUserId },
      select: {
        user_id: true,
        role: true,
        institution_id: true,
        qcto_id: true,
        assigned_provinces: true,
        default_province: true,
      },
    }),
    prisma.user.findUnique({
      where: { user_id: targetUserId },
      select: {
        user_id: true,
        role: true,
        institution_id: true,
        qcto_id: true,
        assigned_provinces: true,
        default_province: true,
        deleted_at: true,
      },
    }),
  ]);

  if (!impersonator || !target) {
    return false;
  }

  // Target user must be active
  if (target.deleted_at) {
    return false;
  }

  // PLATFORM_ADMIN: Can impersonate any user
  if (impersonator.role === "PLATFORM_ADMIN") {
    return true;
  }

  // QCTO_SUPER_ADMIN: Can impersonate QCTO users
  if (impersonator.role === "QCTO_SUPER_ADMIN") {
    const QCTO_ROLES: Role[] = [
      "QCTO_ADMIN",
      "QCTO_USER",
      "QCTO_REVIEWER",
      "QCTO_AUDITOR",
      "QCTO_VIEWER",
    ];
    return QCTO_ROLES.includes(target.role);
  }

  // QCTO_ADMIN: Can impersonate QCTO users in their scope (same province assignments)
  if (impersonator.role === "QCTO_ADMIN") {
    const QCTO_ROLES: Role[] = [
      "QCTO_ADMIN",
      "QCTO_USER",
      "QCTO_REVIEWER",
      "QCTO_AUDITOR",
      "QCTO_VIEWER",
    ];

    if (!QCTO_ROLES.includes(target.role)) {
      return false;
    }

    if (!impersonator.assigned_provinces || impersonator.assigned_provinces.length === 0) {
      return false;
    }

    if (target.role === "QCTO_SUPER_ADMIN") {
      return false;
    }

    if (!target.assigned_provinces || target.assigned_provinces.length === 0) {
      return false;
    }

    const hasCommonProvince = impersonator.assigned_provinces.some((province) =>
      target.assigned_provinces!.includes(province)
    );

    return hasCommonProvince;
  }

  // INSTITUTION_ADMIN: Can impersonate INSTITUTION_STAFF and STUDENT users in their institution
  if (impersonator.role === "INSTITUTION_ADMIN") {
    if (!impersonator.institution_id) {
      return false;
    }

    if (target.institution_id !== impersonator.institution_id) {
      return false;
    }

    const allowedTargetRoles: Role[] = ["INSTITUTION_STAFF", "STUDENT"];
    return allowedTargetRoles.includes(target.role);
  }

  // Other roles cannot impersonate
  return false;
}

/**
 * Create an impersonation session
 */
export async function createImpersonationSession(
  impersonatorUserId: string,
  targetUserId: string,
  ipAddress?: string,
  userAgent?: string
) {
  // Check if impersonator can impersonate target
  const canImpersonate = await canImpersonateUser(impersonatorUserId, targetUserId);
  
  if (!canImpersonate) {
    // Provide a better error message if trying to impersonate yourself
    if (impersonatorUserId === targetUserId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "You cannot impersonate yourself",
        400
      );
    }
    
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      "You do not have permission to impersonate this user",
      403
    );
  }

  // Check max active sessions limit
  const activeSessions = await prisma.impersonationSession.count({
    where: {
      impersonator_id: impersonatorUserId,
      status: "ACTIVE",
      expires_at: { gt: new Date() },
    },
  });

  if (activeSessions >= MAX_ACTIVE_SESSIONS) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      `Maximum ${MAX_ACTIVE_SESSIONS} active impersonation sessions allowed`,
      400
    );
  }

  // Generate token
  const token = generateImpersonationToken();

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + TOKEN_EXPIRY_SECONDS);

  // Create session
  const session = await prisma.impersonationSession.create({
    data: {
      token,
      impersonator_id: impersonatorUserId,
      target_user_id: targetUserId,
      expires_at: expiresAt,
      last_activity: new Date(),
      ip_address: ipAddress,
      user_agent: userAgent,
    },
  });

  return session;
}

/**
 * Validate and get impersonation session by token
 */
export async function getImpersonationSessionByToken(token: string) {
  const session = await prisma.impersonationSession.findUnique({
    where: { token },
    include: {
      impersonator: {
        select: {
          user_id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
        },
      },
      target_user: {
        select: {
          user_id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          institution_id: true,
          qcto_id: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "Impersonation session not found", 404);
  }

  // Check if expired
  if (session.expires_at < new Date()) {
    // Mark as expired
    await prisma.impersonationSession.update({
      where: { id: session.id },
      data: { status: "EXPIRED" },
    });
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Impersonation session has expired", 400);
  }

  // Check if revoked or completed
  if (session.status !== "ACTIVE") {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      `Impersonation session is ${session.status.toLowerCase()}`,
      400
    );
  }

  // Check inactivity timeout
  const inactivityTimeout = new Date();
  inactivityTimeout.setSeconds(inactivityTimeout.getSeconds() - INACTIVITY_TIMEOUT_SECONDS);

  if (session.last_activity < inactivityTimeout) {
    // Mark as expired due to inactivity
    await prisma.impersonationSession.update({
      where: { id: session.id },
      data: { status: "EXPIRED" },
    });
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "Impersonation session expired due to inactivity",
      400
    );
  }

  return session;
}

/**
 * Update last activity timestamp for a session
 */
export async function updateImpersonationActivity(sessionId: string) {
  await prisma.impersonationSession.update({
    where: { id: sessionId },
    data: { last_activity: new Date() },
  });
}

/**
 * Complete (end) an impersonation session
 */
export async function completeImpersonationSession(sessionId: string) {
  await prisma.impersonationSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED" },
  });
}

/**
 * Revoke an impersonation session
 */
export async function revokeImpersonationSession(sessionId: string, revokerUserId: string) {
  const session = await prisma.impersonationSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "Impersonation session not found", 404);
  }

  // Only impersonator or PLATFORM_ADMIN can revoke
  if (session.impersonator_id !== revokerUserId) {
    const revoker = await prisma.user.findUnique({
      where: { user_id: revokerUserId },
      select: { role: true },
    });

    if (revoker?.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only the impersonator or Platform Admin can revoke this session",
        403
      );
    }
  }

  await prisma.impersonationSession.update({
    where: { id: sessionId },
    data: { status: "REVOKED" },
  });
}

/**
 * Get active impersonation sessions for a user
 */
export async function getActiveImpersonationSessions(impersonatorUserId: string) {
  return prisma.impersonationSession.findMany({
    where: {
      impersonator_id: impersonatorUserId,
      status: "ACTIVE",
      expires_at: { gt: new Date() },
    },
    include: {
      target_user: {
        select: {
          user_id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
}

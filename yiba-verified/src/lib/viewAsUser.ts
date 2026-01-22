/**
 * View As User Logic
 * 
 * Allows privileged users to view the system as another user for support/debugging purposes.
 * 
 * Rules:
 * - PLATFORM_ADMIN: Can view as any user
 * - QCTO_SUPER_ADMIN: Can view as QCTO users (QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER)
 * - QCTO_ADMIN: Can view as QCTO users in their scope (same province assignments)
 * - INSTITUTION_ADMIN: Can view as INSTITUTION_STAFF and STUDENT users in their institution
 * 
 * Security:
 * - View As User state is stored in JWT token
 * - All API requests use the "viewing as" user's context
 * - Original user context is preserved for audit logging
 */

import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Role } from "@/lib/rbac";

export interface ViewAsUserContext {
  viewingAsUserId: string;
  viewingAsRole: Role;
  viewingAsInstitutionId: string | null;
  viewingAsQctoId: string | null;
}

/**
 * Check if a user can view as another user
 * 
 * @param viewerUserId User ID of the person trying to view as another user
 * @param targetUserId User ID of the user to view as
 * @returns Promise<boolean> - true if viewer can view as target
 */
export async function canViewAsUser(
  viewerUserId: string,
  targetUserId: string
): Promise<boolean> {
  // Can't view as yourself
  if (viewerUserId === targetUserId) {
    return false;
  }

  // Get both users
  const [viewer, target] = await Promise.all([
    prisma.user.findUnique({
      where: { user_id: viewerUserId },
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

  if (!viewer || !target) {
    return false;
  }

  // Target user must be active
  if (target.deleted_at) {
    return false;
  }

  // PLATFORM_ADMIN: Can view as any user
  if (viewer.role === "PLATFORM_ADMIN") {
    return true;
  }

  // QCTO_SUPER_ADMIN: Can view as QCTO users
  if (viewer.role === "QCTO_SUPER_ADMIN") {
    const QCTO_ROLES: Role[] = [
      "QCTO_ADMIN",
      "QCTO_USER",
      "QCTO_REVIEWER",
      "QCTO_AUDITOR",
      "QCTO_VIEWER",
    ];
    return QCTO_ROLES.includes(target.role);
  }

  // QCTO_ADMIN: Can view as QCTO users in their scope (same province assignments)
  if (viewer.role === "QCTO_ADMIN") {
    const QCTO_ROLES: Role[] = [
      "QCTO_ADMIN",
      "QCTO_USER",
      "QCTO_REVIEWER",
      "QCTO_AUDITOR",
      "QCTO_VIEWER",
    ];

    if (!QCTO_ROLES.includes(target.role)) {
      return false; // Target must be a QCTO role
    }

    // If viewer has no provinces assigned, can't view as anyone
    if (!viewer.assigned_provinces || viewer.assigned_provinces.length === 0) {
      return false;
    }

    // If target is QCTO_SUPER_ADMIN, can't view as (they have no province restrictions)
    if (target.role === "QCTO_SUPER_ADMIN") {
      return false;
    }

    // Target must have at least one province in common with viewer
    if (!target.assigned_provinces || target.assigned_provinces.length === 0) {
      return false;
    }

    // Check if there's any province overlap
    const hasCommonProvince = viewer.assigned_provinces.some((province) =>
      target.assigned_provinces!.includes(province)
    );

    return hasCommonProvince;
  }

  // INSTITUTION_ADMIN: Can view as INSTITUTION_STAFF and STUDENT users in their institution
  if (viewer.role === "INSTITUTION_ADMIN") {
    if (!viewer.institution_id) {
      return false; // Viewer must belong to an institution
    }

    // Target must be in the same institution
    if (target.institution_id !== viewer.institution_id) {
      return false;
    }

    // Target must be INSTITUTION_STAFF or STUDENT
    const allowedTargetRoles: Role[] = ["INSTITUTION_STAFF", "STUDENT"];
    return allowedTargetRoles.includes(target.role);
  }

  // Other roles cannot view as other users
  return false;
}

/**
 * Assert that a user can view as another user, throwing an error if not
 * 
 * @param viewerUserId User ID of the person trying to view as another user
 * @param targetUserId User ID of the user to view as
 * @throws AppError if viewer cannot view as target
 */
export async function assertCanViewAsUser(
  viewerUserId: string,
  targetUserId: string
): Promise<void> {
  const canView = await canViewAsUser(viewerUserId, targetUserId);

  if (!canView) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      "You do not have permission to view as this user",
      403
    );
  }
}

/**
 * Get the View As User context for a target user
 * 
 * @param targetUserId User ID of the user to view as
 * @returns Promise<ViewAsUserContext> - Context for viewing as the target user
 */
export async function getViewAsUserContext(
  targetUserId: string
): Promise<ViewAsUserContext> {
  const target = await prisma.user.findUnique({
    where: { user_id: targetUserId },
    select: {
      user_id: true,
      role: true,
      institution_id: true,
      qcto_id: true,
      deleted_at: true,
    },
  });

  if (!target) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "Target user not found", 404);
  }

  if (target.deleted_at) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "Target user is deleted", 404);
  }

  return {
    viewingAsUserId: target.user_id,
    viewingAsRole: target.role,
    viewingAsInstitutionId: target.institution_id,
    viewingAsQctoId: target.qcto_id,
  };
}

/**
 * Get list of users that the viewer can view as
 * 
 * @param viewerUserId User ID of the person trying to view as other users
 * @returns Promise<Array<{user_id: string, email: string, name: string, role: Role}>>
 */
export async function getViewableUsers(
  viewerUserId: string
): Promise<
  Array<{
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: Role;
    institution_id: string | null;
    qcto_id: string | null;
  }>
> {
  const viewer = await prisma.user.findUnique({
    where: { user_id: viewerUserId },
    select: {
      user_id: true,
      role: true,
      institution_id: true,
      qcto_id: true,
      assigned_provinces: true,
    },
  });

  if (!viewer) {
    return [];
  }

  // PLATFORM_ADMIN: Can view as any user
  if (viewer.role === "PLATFORM_ADMIN") {
    const users = await prisma.user.findMany({
      where: {
        deleted_at: null,
        user_id: { not: viewerUserId }, // Exclude self
      },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        institution_id: true,
        qcto_id: true,
      },
      orderBy: [
        { role: "asc" },
        { last_name: "asc" },
        { first_name: "asc" },
      ],
    });
    return users;
  }

  // QCTO_SUPER_ADMIN: Can view as QCTO users
  if (viewer.role === "QCTO_SUPER_ADMIN") {
    const QCTO_ROLES: Role[] = [
      "QCTO_ADMIN",
      "QCTO_USER",
      "QCTO_REVIEWER",
      "QCTO_AUDITOR",
      "QCTO_VIEWER",
    ];
    const users = await prisma.user.findMany({
      where: {
        deleted_at: null,
        user_id: { not: viewerUserId },
        role: { in: QCTO_ROLES },
      },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        institution_id: true,
        qcto_id: true,
      },
      orderBy: [
        { role: "asc" },
        { last_name: "asc" },
        { first_name: "asc" },
      ],
    });
    return users;
  }

  // QCTO_ADMIN: Can view as QCTO users in their scope (same province assignments)
  if (viewer.role === "QCTO_ADMIN") {
    if (!viewer.assigned_provinces || viewer.assigned_provinces.length === 0) {
      return []; // No provinces assigned, can't view as anyone
    }

    const QCTO_ROLES: Role[] = [
      "QCTO_ADMIN",
      "QCTO_USER",
      "QCTO_REVIEWER",
      "QCTO_AUDITOR",
      "QCTO_VIEWER",
    ];

    // Get all QCTO users with province overlap
    const users = await prisma.user.findMany({
      where: {
        deleted_at: null,
        user_id: { not: viewerUserId },
        role: { in: QCTO_ROLES },
        // Exclude QCTO_SUPER_ADMIN (they have no province restrictions)
        NOT: { role: "QCTO_SUPER_ADMIN" },
        // Must have at least one province in common
        assigned_provinces: {
          hasSome: viewer.assigned_provinces,
        },
      },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        institution_id: true,
        qcto_id: true,
      },
      orderBy: [
        { role: "asc" },
        { last_name: "asc" },
        { first_name: "asc" },
      ],
    });
    return users;
  }

  // INSTITUTION_ADMIN: Can view as INSTITUTION_STAFF and STUDENT users in their institution
  if (viewer.role === "INSTITUTION_ADMIN") {
    if (!viewer.institution_id) {
      return []; // Viewer must belong to an institution
    }

    const allowedTargetRoles: Role[] = ["INSTITUTION_STAFF", "STUDENT"];
    const users = await prisma.user.findMany({
      where: {
        deleted_at: null,
        user_id: { not: viewerUserId },
        institution_id: viewer.institution_id,
        role: { in: allowedTargetRoles },
      },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        institution_id: true,
        qcto_id: true,
      },
      orderBy: [
        { role: "asc" },
        { last_name: "asc" },
        { first_name: "asc" },
      ],
    });
    return users;
  }

  // Other roles cannot view as other users
  return [];
}

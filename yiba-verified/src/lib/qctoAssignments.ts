/**
 * Generic QCTO assignment system: delegates resource access to reviewers/auditors.
 * Used for readiness review access and future resource types.
 *
 * - QctoAssignment is the canonical source for "who can access this resource".
 * - ReviewAssignment is kept in sync for READINESS (existing UI/APIs).
 * - assertAssignedOrAdmin: reviewers/auditors only see assigned items; QCTO_ADMIN/SUPER_ADMIN/PLATFORM_ADMIN bypass.
 */

import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { ApiContext } from "@/lib/api/context";
import type { QctoAssignmentRole, QctoAssignmentStatus } from "@prisma/client";

export type QctoResourceType = "READINESS" | "SUBMISSION" | "QCTO_REQUEST";

const ADMIN_ROLES = ["QCTO_SUPER_ADMIN", "QCTO_ADMIN", "PLATFORM_ADMIN"] as const;

function isAdminRole(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Map assignment_role string to enum for Prisma
 */
function toAssignmentRole(role: string): QctoAssignmentRole {
  if (role === "AUDITOR") return "AUDITOR";
  return "REVIEWER";
}

/**
 * Assign a resource to a reviewer/auditor. Creates QctoAssignment (ACTIVE).
 * For READINESS, callers should also create ReviewAssignment so existing UI stays in sync.
 */
export async function assignResourceToReviewer(
  ctx: ApiContext,
  params: {
    resource_type: QctoResourceType;
    resource_id: string;
    assigned_to_user_id: string;
    assignment_role: "REVIEWER" | "AUDITOR";
  }
): Promise<{ id: string }> {
  const assignmentRole = toAssignmentRole(params.assignment_role);

  const existing = await prisma.qctoAssignment.findUnique({
    where: {
      resource_type_resource_id_assigned_to_user_id_assignment_role: {
        resource_type: params.resource_type,
        resource_id: params.resource_id,
        assigned_to_user_id: params.assigned_to_user_id,
        assignment_role: assignmentRole,
      },
    },
  });

  if (existing) {
    if (existing.status !== "ACTIVE") {
      await prisma.qctoAssignment.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", updated_at: new Date() },
      });
    }
    return { id: existing.id };
  }

  const created = await prisma.qctoAssignment.create({
    data: {
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      assigned_to_user_id: params.assigned_to_user_id,
      assigned_by_user_id: ctx.userId,
      assignment_role: assignmentRole,
      status: "ACTIVE",
    },
  });
  return { id: created.id };
}

/**
 * Remove assignment: set status to REMOVED (soft) so history is preserved.
 */
export async function removeAssignment(
  _ctx: ApiContext,
  params: {
    resource_type: QctoResourceType;
    resource_id: string;
    assigned_to_user_id: string;
    assignment_role?: "REVIEWER" | "AUDITOR";
  }
): Promise<void> {
  const baseWhere = {
    resource_type: params.resource_type,
    resource_id: params.resource_id,
    assigned_to_user_id: params.assigned_to_user_id,
    status: "ACTIVE" as const,
  };
  const where = params.assignment_role
    ? { ...baseWhere, assignment_role: toAssignmentRole(params.assignment_role) }
    : baseWhere;

  const assignments = await prisma.qctoAssignment.findMany({
    where,
  });

  if (assignments.length === 0) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "Assignment not found", 404);
  }

  await prisma.qctoAssignment.updateMany({
    where: {
      id: { in: assignments.map((a) => a.id) },
    },
    data: { status: "REMOVED", updated_at: new Date() },
  });
}

/**
 * Get assignments for a user (optionally filtered by resource_type and/or role).
 */
export async function getAssignmentsForUser(
  userId: string,
  options?: {
    resource_type?: QctoResourceType;
    assignment_role?: "REVIEWER" | "AUDITOR";
    status?: QctoAssignmentStatus;
  }
): Promise<
  Array<{
    id: string;
    resource_type: string;
    resource_id: string;
    assignment_role: string;
    status: string;
    created_at: Date;
  }>
> {
  const where: {
    assigned_to_user_id: string;
    resource_type?: string;
    assignment_role?: QctoAssignmentRole;
    status?: QctoAssignmentStatus;
  } = {
    assigned_to_user_id: userId,
  };
  if (options?.resource_type) where.resource_type = options.resource_type;
  if (options?.assignment_role) where.assignment_role = toAssignmentRole(options.assignment_role);
  if (options?.status) where.status = options.status;

  const list = await prisma.qctoAssignment.findMany({
    where,
    select: {
      id: true,
      resource_type: true,
      resource_id: true,
      assignment_role: true,
      status: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
  });

  return list.map((a) => ({
    id: a.id,
    resource_type: a.resource_type,
    resource_id: a.resource_id,
    assignment_role: a.assignment_role,
    status: a.status,
    created_at: a.created_at,
  }));
}

/**
 * Assert that the user is either an admin (QCTO_ADMIN, QCTO_SUPER_ADMIN, PLATFORM_ADMIN) or
 * has an ACTIVE assignment to the resource. Throws AppError 403 if not.
 */
export async function assertAssignedOrAdmin(
  resource_type: QctoResourceType,
  resource_id: string,
  userId: string,
  role: string
): Promise<void> {
  if (isAdminRole(role)) {
    return;
  }

  const assignment = await prisma.qctoAssignment.findFirst({
    where: {
      resource_type,
      resource_id,
      assigned_to_user_id: userId,
      status: "ACTIVE",
    },
  });

  if (!assignment) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      "You do not have access to this resource. Only assigned reviewers/auditors or admins can access it.",
      403
    );
  }
}

/**
 * Return readiness IDs that the user is assigned to (ACTIVE QctoAssignment for READINESS).
 * Used to filter the readiness list for reviewers/auditors.
 */
export async function getAssignedReadinessIdsForUser(userId: string): Promise<string[]> {
  const list = await prisma.qctoAssignment.findMany({
    where: {
      resource_type: "READINESS",
      assigned_to_user_id: userId,
      status: "ACTIVE",
    },
    select: { resource_id: true },
    distinct: ["resource_id"],
  });
  return list.map((a) => a.resource_id);
}

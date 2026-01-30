/**
 * Review Assignment Logic
 * 
 * Handles assignment of reviews (readiness, submissions, etc.) to QCTO reviewers
 * based on province matching and supports multiple reviewers per review (fail-safe feature).
 * 
 * Rules:
 * - Reviews can be assigned to MULTIPLE reviewers simultaneously (fail-safe)
 * - Reviewers must have the review's province in their `assigned_provinces`
 * - QCTO_SUPER_ADMIN can be assigned to reviews from any province
 * - Only QCTO_SUPER_ADMIN and QCTO_ADMIN can assign reviews (enforced via QCTO_ASSIGN capability in API)
 * - QCTO_VIEWER cannot assign reviews (read-only)
 */

import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { ApiContext } from "@/lib/api/context";
import { createAuditLog } from "@/services/audit.service";
import type { AuditEntityType } from "@prisma/client";
import { assignResourceToReviewer, removeAssignment } from "@/lib/qctoAssignments";

export type ReviewType = "READINESS" | "SUBMISSION" | "QCTO_REQUEST";

export type AssignmentRole = "REVIEWER" | "AUDITOR";

export interface ReviewAssignmentInput {
  reviewType: ReviewType;
  reviewId: string;
  assignedToUserId: string;
  assignmentRole?: AssignmentRole; // default REVIEWER
  notes?: string;
}

/**
 * Get the province of a review based on its type and ID
 */
export async function getReviewProvince(
  reviewType: ReviewType,
  reviewId: string
): Promise<string | null> {
  if (reviewType === "READINESS") {
    const readiness = await prisma.readiness.findUnique({
      where: { readiness_id: reviewId },
      include: { institution: { select: { province: true } } },
    });
    return readiness?.institution.province || null;
  }

  if (reviewType === "SUBMISSION") {
    const submission = await prisma.submission.findUnique({
      where: { submission_id: reviewId },
      include: { institution: { select: { province: true } } },
    });
    return submission?.institution.province || null;
  }

  if (reviewType === "QCTO_REQUEST") {
    const request = await prisma.qCTORequest.findUnique({
      where: { request_id: reviewId },
      include: { institution: { select: { province: true } } },
    });
    return request?.institution.province || null;
  }

  return null;
}

const REVIEW_TYPE_TO_AUDIT_ENTITY: Record<ReviewType, AuditEntityType> = {
  READINESS: "READINESS",
  SUBMISSION: "SUBMISSION",
  QCTO_REQUEST: "QCTO_REQUEST",
};

/**
 * Get institution ID for a review (for audit log institution_id)
 */
export async function getReviewInstitutionId(
  reviewType: ReviewType,
  reviewId: string
): Promise<string | null> {
  if (reviewType === "READINESS") {
    const r = await prisma.readiness.findUnique({
      where: { readiness_id: reviewId },
      select: { institution_id: true },
    });
    return r?.institution_id ?? null;
  }
  if (reviewType === "SUBMISSION") {
    const s = await prisma.submission.findUnique({
      where: { submission_id: reviewId },
      select: { institution_id: true },
    });
    return s?.institution_id ?? null;
  }
  if (reviewType === "QCTO_REQUEST") {
    const q = await prisma.qCTORequest.findUnique({
      where: { request_id: reviewId },
      select: { institution_id: true },
    });
    return q?.institution_id ?? null;
  }
  return null;
}

/**
 * Check if a reviewer can be assigned to a review based on province matching
 * 
 * Rules:
 * - QCTO_SUPER_ADMIN: can be assigned to reviews from any province
 * - Other QCTO roles: must have the review's province in their `assigned_provinces`
 */
export async function canAssignReviewerToReview(
  reviewerUserId: string,
  reviewProvince: string | null
): Promise<boolean> {
  const reviewer = await prisma.user.findUnique({
    where: { user_id: reviewerUserId },
    select: {
      role: true,
      assigned_provinces: true,
    },
  });

  if (!reviewer) {
    return false;
  }

  // QCTO_SUPER_ADMIN can be assigned to reviews from any province
  if (reviewer.role === "QCTO_SUPER_ADMIN") {
    return true;
  }

  // If review has no province, deny (shouldn't happen, but safety check)
  if (!reviewProvince) {
    return false;
  }

  // Other QCTO roles must have the review's province in their assigned_provinces
  const QCTO_ROLES = [
    "QCTO_ADMIN",
    "QCTO_USER",
    "QCTO_REVIEWER",
    "QCTO_AUDITOR",
    "QCTO_VIEWER",
  ];

  if (!QCTO_ROLES.includes(reviewer.role)) {
    return false; // Not a QCTO role
  }

  if (!reviewer.assigned_provinces || reviewer.assigned_provinces.length === 0) {
    return false; // No provinces assigned
  }

  return reviewer.assigned_provinces.includes(reviewProvince);
}

/**
 * Assign a review to a reviewer
 * 
 * Creates a ReviewAssignment record if:
 * - Reviewer can be assigned (province matching)
 * - Assignment doesn't already exist
 * 
 * @throws AppError if assignment is invalid
 */
export async function assignReviewToReviewer(
  ctx: ApiContext,
  input: ReviewAssignmentInput
): Promise<void> {
  // Check if assigner has permission to assign reviews (Admin/Super Admin only; API also checks hasCap QCTO_ASSIGN)
  const CAN_ASSIGN_ROLES = [
    "PLATFORM_ADMIN",
    "QCTO_SUPER_ADMIN",
    "QCTO_ADMIN",
  ];

  if (!CAN_ASSIGN_ROLES.includes(ctx.role)) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      `Role ${ctx.role} cannot assign reviews`,
      403
    );
  }

  // Get review province
  const reviewProvince = await getReviewProvince(input.reviewType, input.reviewId);

  if (!reviewProvince) {
    throw new AppError(
      ERROR_CODES.NOT_FOUND,
      `Review ${input.reviewType}:${input.reviewId} not found or has no province`,
      404
    );
  }

  // Check if reviewer can be assigned to this review
  const canAssign = await canAssignReviewerToReview(input.assignedToUserId, reviewProvince);

  if (!canAssign) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      `Reviewer cannot be assigned to this review: province mismatch or invalid reviewer role`,
      403
    );
  }

  const assignmentRole = input.assignmentRole ?? "REVIEWER";

  // Check if assignment already exists (same reviewer + role for this review)
  const existingAssignment = await prisma.reviewAssignment.findUnique({
    where: {
      review_type_review_id_assigned_to_assignment_role: {
        review_type: input.reviewType,
        review_id: input.reviewId,
        assigned_to: input.assignedToUserId,
        assignment_role: assignmentRole,
      },
    },
  });

  if (existingAssignment) {
    // Assignment already exists - update it if needed
    if (input.notes && input.notes !== existingAssignment.notes) {
      await prisma.reviewAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          notes: input.notes,
          status: "ASSIGNED", // Reset to ASSIGNED if it was cancelled
        },
      });
      const institutionId = await getReviewInstitutionId(input.reviewType, input.reviewId);
      await createAuditLog(prisma, {
        entityType: REVIEW_TYPE_TO_AUDIT_ENTITY[input.reviewType],
        entityId: input.reviewId,
        fieldName: "review_assignment",
        oldValue: null,
        newValue: JSON.stringify({
          action: "reassigned",
          assignedTo: input.assignedToUserId,
          assignedBy: ctx.userId,
          notes: input.notes,
        }),
        changedBy: ctx.userId,
        roleAtTime: ctx.role as import("@prisma/client").UserRole,
        changeType: "UPDATE",
        institutionId,
      });
    }
    return; // Assignment already exists, no error
  }

  // Create new assignment
  await prisma.reviewAssignment.create({
    data: {
      review_type: input.reviewType,
      review_id: input.reviewId,
      assigned_to: input.assignedToUserId,
      assignment_role: assignmentRole,
      assigned_by: ctx.userId,
      status: "ASSIGNED",
      notes: input.notes || null,
    },
  });

  // Sync generic QctoAssignment for assertAssignedOrAdmin / list filtering
  await assignResourceToReviewer(ctx, {
    resource_type: input.reviewType,
    resource_id: input.reviewId,
    assigned_to_user_id: input.assignedToUserId,
    assignment_role: assignmentRole,
  });

  const institutionId = await getReviewInstitutionId(input.reviewType, input.reviewId);
  await createAuditLog(prisma, {
    entityType: REVIEW_TYPE_TO_AUDIT_ENTITY[input.reviewType],
    entityId: input.reviewId,
    fieldName: "review_assignment",
    oldValue: null,
    newValue: JSON.stringify({
      action: "assigned",
      assignedTo: input.assignedToUserId,
      assignedBy: ctx.userId,
      notes: input.notes ?? null,
    }),
    changedBy: ctx.userId,
    roleAtTime: ctx.role as import("@prisma/client").UserRole,
    changeType: "CREATE",
    institutionId,
  });
}

/**
 * Unassign a review from a reviewer
 */
export async function unassignReviewFromReviewer(
  ctx: ApiContext,
  reviewType: ReviewType,
  reviewId: string,
  assignedToUserId: string
): Promise<void> {
  // Check if assigner has permission to unassign reviews (same as assign: Admin/Super Admin only)
  const CAN_ASSIGN_ROLES = [
    "PLATFORM_ADMIN",
    "QCTO_SUPER_ADMIN",
    "QCTO_ADMIN",
  ];

  if (!CAN_ASSIGN_ROLES.includes(ctx.role)) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      `Role ${ctx.role} cannot unassign reviews`,
      403
    );
  }

  // Find assignment(s) for this user and review; if multiple (REVIEWER + AUDITOR), cancel all
  const assignments = await prisma.reviewAssignment.findMany({
    where: {
      review_type: reviewType,
      review_id: reviewId,
      assigned_to: assignedToUserId,
      status: { not: "CANCELLED" },
    },
  });

  if (assignments.length === 0) {
    throw new AppError(
      ERROR_CODES.NOT_FOUND,
      `Review assignment not found`,
      404
    );
  }

  await prisma.reviewAssignment.updateMany({
    where: {
      review_type: reviewType,
      review_id: reviewId,
      assigned_to: assignedToUserId,
    },
    data: {
      status: "CANCELLED",
    },
  });

  // Sync generic QctoAssignment: mark as REMOVED
  await removeAssignment(ctx, {
    resource_type: reviewType,
    resource_id: reviewId,
    assigned_to_user_id: assignedToUserId,
  });

  const institutionId = await getReviewInstitutionId(reviewType, reviewId);
  await createAuditLog(prisma, {
    entityType: REVIEW_TYPE_TO_AUDIT_ENTITY[reviewType],
    entityId: reviewId,
    fieldName: "review_assignment",
    oldValue: JSON.stringify({
      action: "unassigned",
      assignedTo: assignedToUserId,
      assignedBy: ctx.userId,
    }),
    newValue: null,
    changedBy: ctx.userId,
    roleAtTime: ctx.role as import("@prisma/client").UserRole,
    changeType: "DELETE",
    institutionId,
  });
}

/**
 * Get all reviewers assigned to a review
 */
export async function getReviewAssignments(
  reviewType: ReviewType,
  reviewId: string,
  assignmentRole?: AssignmentRole
): Promise<Array<{
  id: string;
  assigned_to: string;
  assigned_by: string;
  assigned_at: Date;
  status: string;
  assignment_role: string;
  notes: string | null;
  reviewer: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  assigner: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}>> {
  const assignments = await prisma.reviewAssignment.findMany({
    where: {
      review_type: reviewType,
      review_id: reviewId,
      status: { not: "CANCELLED" }, // Only active assignments
      ...(assignmentRole && { assignment_role: assignmentRole }),
    },
    include: {
      reviewer: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
        },
      },
      assigner: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
    orderBy: {
      assigned_at: "desc",
    },
  });

  return assignments.map((a) => ({
    id: a.id,
    assigned_to: a.assigned_to,
    assigned_by: a.assigned_by,
    assigned_at: a.assigned_at,
    status: a.status,
    assignment_role: a.assignment_role,
    notes: a.notes,
    reviewer: a.reviewer,
    assigner: a.assigner,
  }));
}

/**
 * Get all reviews assigned to a reviewer
 */
export async function getReviewsAssignedToReviewer(
  reviewerUserId: string,
  reviewType?: ReviewType,
  status?: string
): Promise<Array<{
  id: string;
  review_type: string;
  review_id: string;
  assigned_at: Date;
  status: string;
  notes: string | null;
}>> {
  const assignments = await prisma.reviewAssignment.findMany({
    where: {
      assigned_to: reviewerUserId,
      ...(reviewType && { review_type: reviewType }),
      ...(status && { status }),
    },
    orderBy: {
      assigned_at: "desc",
    },
  });

  return assignments.map((a) => ({
    id: a.id,
    review_type: a.review_type,
    review_id: a.review_id,
    assigned_at: a.assigned_at,
    status: a.status,
    notes: a.notes,
  }));
}

/**
 * Check if a reviewer is assigned to a review (any role: REVIEWER or AUDITOR)
 */
export async function isReviewerAssignedToReview(
  reviewerUserId: string,
  reviewType: ReviewType,
  reviewId: string
): Promise<boolean> {
  const assignment = await prisma.reviewAssignment.findFirst({
    where: {
      review_type: reviewType,
      review_id: reviewId,
      assigned_to: reviewerUserId,
      status: { not: "CANCELLED" },
    },
  });
  return assignment != null;
}

/**
 * Auto-assign reviews to eligible reviewers based on province matching
 * 
 * Finds all eligible reviewers (those with matching province assignments)
 * and assigns the review to them. This supports the fail-safe multiple reviewer feature.
 * 
 * @param reviewType Type of review (READINESS, SUBMISSION, etc.)
 * @param reviewId ID of the review
 * @param assignerUserId User ID who is making the assignment (for audit trail)
 * @returns Array of user IDs who were assigned
 */
export async function autoAssignReviewToEligibleReviewers(
  reviewType: ReviewType,
  reviewId: string,
  assignerUserId: string
): Promise<string[]> {
  // Get review province
  const reviewProvince = await getReviewProvince(reviewType, reviewId);

  if (!reviewProvince) {
    throw new AppError(
      ERROR_CODES.NOT_FOUND,
      `Review ${reviewType}:${reviewId} not found or has no province`,
      404
    );
  }

  // Find all eligible reviewers
  // QCTO_SUPER_ADMIN can be assigned to any province
  // Other QCTO roles must have the review's province in their assigned_provinces
  const eligibleReviewers = await prisma.user.findMany({
    where: {
      role: {
        in: [
          "QCTO_SUPER_ADMIN",
          "QCTO_ADMIN",
          "QCTO_REVIEWER",
          "QCTO_AUDITOR",
          "QCTO_VIEWER", // Viewers can also be assigned (they can view reviews)
        ],
      },
      deleted_at: null,
      OR: [
        { role: "QCTO_SUPER_ADMIN" }, // Super admin can be assigned to any province
        {
          assigned_provinces: {
            has: reviewProvince, // Has the review's province in assigned_provinces
          },
        },
      ],
    },
    select: {
      user_id: true,
    },
  });

  const assignedUserIds: string[] = [];

  // Assign review to each eligible reviewer (as REVIEWER role)
  for (const reviewer of eligibleReviewers) {
    try {
      // Check if assignment already exists (REVIEWER role)
      const existing = await prisma.reviewAssignment.findUnique({
        where: {
          review_type_review_id_assigned_to_assignment_role: {
            review_type: reviewType,
            review_id: reviewId,
            assigned_to: reviewer.user_id,
            assignment_role: "REVIEWER",
          },
        },
      });

      if (existing && existing.status !== "CANCELLED") {
        // Already assigned, skip
        assignedUserIds.push(reviewer.user_id);
        continue;
      }

      // Create or reactivate assignment (REVIEWER role)
      await prisma.reviewAssignment.upsert({
        where: {
          review_type_review_id_assigned_to_assignment_role: {
            review_type: reviewType,
            review_id: reviewId,
            assigned_to: reviewer.user_id,
            assignment_role: "REVIEWER",
          },
        },
        update: {
          status: "ASSIGNED", // Reactivate if it was cancelled
          assigned_by: assignerUserId,
        },
        create: {
          review_type: reviewType,
          review_id: reviewId,
          assigned_to: reviewer.user_id,
          assignment_role: "REVIEWER",
          assigned_by: assignerUserId,
          status: "ASSIGNED",
        },
      });

      assignedUserIds.push(reviewer.user_id);
    } catch (error) {
      // Log error but continue with other reviewers
      console.error(
        `Failed to assign review ${reviewType}:${reviewId} to reviewer ${reviewer.user_id}:`,
        error
      );
    }
  }

  return assignedUserIds;
}

/**
 * Get eligible reviewers for a review (based on province matching)
 * 
 * Returns all reviewers who can be assigned to this review.
 */
export async function getEligibleReviewersForReview(
  reviewType: ReviewType,
  reviewId: string
): Promise<Array<{
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  default_province: string | null;
  assigned_provinces: string[];
}>> {
  // Get review province
  const reviewProvince = await getReviewProvince(reviewType, reviewId);

  if (!reviewProvince) {
    return []; // No province, no eligible reviewers
  }

  // Find all eligible reviewers
  const eligibleReviewers = await prisma.user.findMany({
    where: {
      role: {
        in: [
          "QCTO_SUPER_ADMIN",
          "QCTO_ADMIN",
          "QCTO_REVIEWER",
          "QCTO_AUDITOR",
          "QCTO_VIEWER",
        ],
      },
      deleted_at: null,
      OR: [
        { role: "QCTO_SUPER_ADMIN" }, // Super admin can be assigned to any province
        {
          assigned_provinces: {
            has: reviewProvince, // Has the review's province in assigned_provinces
          },
        },
      ],
    },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
      role: true,
      default_province: true,
      assigned_provinces: true,
    },
    orderBy: [
      { role: "asc" }, // QCTO_SUPER_ADMIN first
      { last_name: "asc" },
      { first_name: "asc" },
    ],
  });

  return eligibleReviewers;
}

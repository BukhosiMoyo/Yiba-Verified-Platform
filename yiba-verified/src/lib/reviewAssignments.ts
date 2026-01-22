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
 * - QCTO_ADMIN, QCTO_REVIEWER, QCTO_AUDITOR can assign reviews
 * - QCTO_VIEWER cannot assign reviews (read-only)
 */

import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { ApiContext } from "@/lib/api/context";

export type ReviewType = "READINESS" | "SUBMISSION" | "QCTO_REQUEST";

export interface ReviewAssignmentInput {
  reviewType: ReviewType;
  reviewId: string;
  assignedToUserId: string;
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
  // Check if assigner has permission to assign reviews
  const CAN_ASSIGN_ROLES = [
    "PLATFORM_ADMIN",
    "QCTO_SUPER_ADMIN",
    "QCTO_ADMIN",
    "QCTO_REVIEWER",
    "QCTO_AUDITOR",
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

  // Check if assignment already exists
  const existingAssignment = await prisma.reviewAssignment.findUnique({
    where: {
      review_type_review_id_assigned_to: {
        review_type: input.reviewType,
        review_id: input.reviewId,
        assigned_to: input.assignedToUserId,
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
        },
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
      assigned_by: ctx.userId,
      status: "ASSIGNED",
      notes: input.notes || null,
    },
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
  // Check if assigner has permission to unassign reviews
  const CAN_ASSIGN_ROLES = [
    "PLATFORM_ADMIN",
    "QCTO_SUPER_ADMIN",
    "QCTO_ADMIN",
    "QCTO_REVIEWER",
    "QCTO_AUDITOR",
  ];

  if (!CAN_ASSIGN_ROLES.includes(ctx.role)) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      `Role ${ctx.role} cannot unassign reviews`,
      403
    );
  }

  // Find and update assignment status to CANCELLED
  const assignment = await prisma.reviewAssignment.findUnique({
    where: {
      review_type_review_id_assigned_to: {
        review_type: reviewType,
        review_id: reviewId,
        assigned_to: assignedToUserId,
      },
    },
  });

  if (!assignment) {
    throw new AppError(
      ERROR_CODES.NOT_FOUND,
      `Review assignment not found`,
      404
    );
  }

  await prisma.reviewAssignment.update({
    where: { id: assignment.id },
    data: {
      status: "CANCELLED",
    },
  });
}

/**
 * Get all reviewers assigned to a review
 */
export async function getReviewAssignments(
  reviewType: ReviewType,
  reviewId: string
): Promise<Array<{
  id: string;
  assigned_to: string;
  assigned_by: string;
  assigned_at: Date;
  status: string;
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
 * Check if a reviewer is assigned to a review
 */
export async function isReviewerAssignedToReview(
  reviewerUserId: string,
  reviewType: ReviewType,
  reviewId: string
): Promise<boolean> {
  const assignment = await prisma.reviewAssignment.findUnique({
    where: {
      review_type_review_id_assigned_to: {
        review_type: reviewType,
        review_id: reviewId,
        assigned_to: reviewerUserId,
      },
    },
  });

  if (!assignment) {
    return false;
  }

  // Check if assignment is active (not cancelled)
  return assignment.status !== "CANCELLED";
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

  // Assign review to each eligible reviewer
  for (const reviewer of eligibleReviewers) {
    try {
      // Check if assignment already exists
      const existing = await prisma.reviewAssignment.findUnique({
        where: {
          review_type_review_id_assigned_to: {
            review_type: reviewType,
            review_id: reviewId,
            assigned_to: reviewer.user_id,
          },
        },
      });

      if (existing && existing.status !== "CANCELLED") {
        // Already assigned, skip
        assignedUserIds.push(reviewer.user_id);
        continue;
      }

      // Create assignment
      await prisma.reviewAssignment.upsert({
        where: {
          review_type_review_id_assigned_to: {
            review_type: reviewType,
            review_id: reviewId,
            assigned_to: reviewer.user_id,
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

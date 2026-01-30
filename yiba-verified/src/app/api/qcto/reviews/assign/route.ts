/**
 * POST /api/qcto/reviews/assign
 * 
 * Assign a review to a reviewer (or multiple reviewers).
 * Supports province-based assignment matching.
 * 
 * Body:
 * {
 *   reviewType: "READINESS" | "SUBMISSION" | "QCTO_REQUEST",
 *   reviewId: string,
 *   assignedToUserId?: string, // Optional: assign to specific user
 *   autoAssign?: boolean, // Optional: auto-assign to all eligible reviewers
 *   notes?: string
 * }
 * 
 * If autoAssign is true, assigns to all eligible reviewers (fail-safe feature).
 * If assignedToUserId is provided, assigns to that specific reviewer.
 * Both can be used together.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import {
  assignReviewToReviewer,
  autoAssignReviewToEligibleReviewers,
  getReviewAssignments,
  getEligibleReviewersForReview,
  type ReviewType,
} from "@/lib/reviewAssignments";
import { canAccessQctoData } from "@/lib/rbac";
import { hasCap } from "@/lib/capabilities";
import { Notifications } from "@/lib/notifications";

interface AssignReviewBody {
  reviewType: ReviewType;
  reviewId: string;
  assignedToUserId?: string;
  assignmentRole?: "REVIEWER" | "AUDITOR";
  autoAssign?: boolean;
  notes?: string;
}

/**
 * POST /api/qcto/reviews/assign
 * Assign a review to reviewer(s)
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    if (!canAccessQctoData(ctx.role)) {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only QCTO and platform administrators can assign reviews",
          403
        )
      );
    }

    // Only Admin and Super Admin can assign (QCTO_ASSIGN); PLATFORM_ADMIN can assign for app oversight
    if (ctx.role !== "PLATFORM_ADMIN" && !hasCap(ctx.role, "QCTO_ASSIGN")) {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only QCTO Admin and Super Admin can assign reviews",
          403
        )
      );
    }

    const body: AssignReviewBody = await request.json();

    // Validate required fields
    if (!body.reviewType || !body.reviewId) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "reviewType and reviewId are required",
          400
        )
      );
    }

    // Validate reviewType
    const validReviewTypes: ReviewType[] = ["READINESS", "SUBMISSION", "QCTO_REQUEST"];
    if (!validReviewTypes.includes(body.reviewType)) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Invalid reviewType: ${body.reviewType}. Must be one of: ${validReviewTypes.join(", ")}`,
          400
        )
      );
    }

    const assignedUserIds: string[] = [];

    // Auto-assign to all eligible reviewers if requested
    if (body.autoAssign) {
      const autoAssigned = await autoAssignReviewToEligibleReviewers(
        body.reviewType,
        body.reviewId,
        ctx.userId
      );
      assignedUserIds.push(...autoAssigned);
    }

    // Assign to specific reviewer if provided
    if (body.assignedToUserId) {
      await assignReviewToReviewer(ctx, {
        reviewType: body.reviewType,
        reviewId: body.reviewId,
        assignedToUserId: body.assignedToUserId,
        assignmentRole: body.assignmentRole ?? "REVIEWER",
        notes: body.notes,
      });
      if (!assignedUserIds.includes(body.assignedToUserId)) {
        assignedUserIds.push(body.assignedToUserId);
      }
    }

    // Notify each assigned user (one row per recipient)
    for (const userId of assignedUserIds) {
      await Notifications.reviewAssigned(userId, body.reviewType, body.reviewId);
    }

    // Get updated assignments
    const assignments = await getReviewAssignments(body.reviewType, body.reviewId);

    return NextResponse.json({
      success: true,
      message: `Review assigned to ${assignedUserIds.length} reviewer(s)`,
      assignedUserIds,
      assignments,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/qcto/reviews/assign error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to assign review", 500)
    );
  }
}

/**
 * GET /api/qcto/reviews/assign?reviewType=READINESS&reviewId=xxx
 * Get assignments for a review
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    if (!canAccessQctoData(ctx.role)) {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only QCTO and platform administrators can view review assignments",
          403
        )
      );
    }

    const { searchParams } = new URL(request.url);
    const reviewType = searchParams.get("reviewType") as ReviewType | null;
    const reviewId = searchParams.get("reviewId");

    if (!reviewType || !reviewId) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "reviewType and reviewId query parameters are required",
          400
        )
      );
    }

    // Validate reviewType
    const validReviewTypes: ReviewType[] = ["READINESS", "SUBMISSION", "QCTO_REQUEST"];
    if (!validReviewTypes.includes(reviewType)) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Invalid reviewType: ${reviewType}. Must be one of: ${validReviewTypes.join(", ")}`,
          400
        )
      );
    }

    const assignments = await getReviewAssignments(reviewType, reviewId);

    return NextResponse.json({
      reviewType,
      reviewId,
      assignments,
      count: assignments.length,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("GET /api/qcto/reviews/assign error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to get review assignments", 500)
    );
  }
}

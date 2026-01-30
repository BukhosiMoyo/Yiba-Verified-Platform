/**
 * POST /api/qcto/reviews/unassign
 *
 * Unassign a reviewer from a review.
 * Same permission as assign: QCTO_ASSIGN (Admin/Super Admin) or PLATFORM_ADMIN.
 *
 * Body:
 * {
 *   reviewType: "READINESS" | "SUBMISSION" | "QCTO_REQUEST",
 *   reviewId: string,
 *   assignedToUserId: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { unassignReviewFromReviewer, getReviewAssignments, type ReviewType } from "@/lib/reviewAssignments";
import { canAccessQctoData } from "@/lib/rbac";
import { hasCap } from "@/lib/capabilities";

interface UnassignReviewBody {
  reviewType: ReviewType;
  reviewId: string;
  assignedToUserId: string;
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    if (!canAccessQctoData(ctx.role)) {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only QCTO and platform administrators can unassign reviews",
          403
        )
      );
    }

    if (ctx.role !== "PLATFORM_ADMIN" && !hasCap(ctx.role, "QCTO_ASSIGN")) {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only QCTO Admin and Super Admin can unassign reviews",
          403
        )
      );
    }

    const body: UnassignReviewBody = await request.json();

    if (!body.reviewType || !body.reviewId || !body.assignedToUserId) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "reviewType, reviewId and assignedToUserId are required",
          400
        )
      );
    }

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

    await unassignReviewFromReviewer(ctx, body.reviewType, body.reviewId, body.assignedToUserId);

    const assignments = await getReviewAssignments(body.reviewType, body.reviewId);

    return NextResponse.json({
      success: true,
      message: "Reviewer unassigned successfully",
      assignments,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/qcto/reviews/unassign error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to unassign review", 500)
    );
  }
}

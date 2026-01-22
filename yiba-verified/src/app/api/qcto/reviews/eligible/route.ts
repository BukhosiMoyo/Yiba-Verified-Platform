/**
 * GET /api/qcto/reviews/eligible?reviewType=READINESS&reviewId=xxx
 * 
 * Get eligible reviewers for a review (based on province matching).
 * Useful for UI dropdowns when assigning reviews.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getEligibleReviewersForReview, type ReviewType } from "@/lib/reviewAssignments";
import { canAccessQctoData } from "@/lib/rbac";

/**
 * GET /api/qcto/reviews/eligible
 * Get eligible reviewers for a review
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    if (!canAccessQctoData(ctx.role)) {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only QCTO and platform administrators can view eligible reviewers",
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

    const eligibleReviewers = await getEligibleReviewersForReview(reviewType, reviewId);

    return NextResponse.json({
      reviewType,
      reviewId,
      eligibleReviewers,
      count: eligibleReviewers.length,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("GET /api/qcto/reviews/eligible error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to get eligible reviewers", 500)
    );
  }
}

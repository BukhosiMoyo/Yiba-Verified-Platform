import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";
import { getOrCalculateTrustScore } from "@/lib/institutionTrustScore";

interface RouteParams {
  params: Promise<{
    institutionId: string;
  }>;
}

/**
 * GET /api/qcto/institutions/[institutionId]/trust-score
 * 
 * Returns institution trust score (QCTO only).
 * Calculates or retrieves cached trust score.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { institutionId } = await params;

    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can access this endpoint", 403));
    }

    const trustScore = await getOrCalculateTrustScore(institutionId);

    return NextResponse.json(trustScore);
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("GET /api/qcto/institutions/[institutionId]/trust-score error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to fetch trust score", 500));
  }
}

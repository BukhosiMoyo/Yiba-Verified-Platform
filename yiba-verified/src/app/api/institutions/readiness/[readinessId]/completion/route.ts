import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { calculateSectionCompletion } from "@/lib/readinessCompletion";

interface RouteParams {
  params: Promise<{
    readinessId: string;
  }>;
}

/**
 * GET /api/institutions/readiness/[readinessId]/completion
 * 
 * Calculate and return completion percentages for a readiness record.
 * Returns:
 * - Overall completion %
 * - Per-section completion %
 * - Missing required fields
 * - Validation warnings
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { ctx } = await requireAuth(request);
    const { readinessId } = await params;

    // RBAC: Institution roles and PLATFORM_ADMIN can view
    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions to view readiness completion", 403);
    }

    // Fetch readiness record
    const readiness = await prisma.readiness.findFirst({
      where: {
        readiness_id: readinessId,
        deleted_at: null,
      },
      include: {
        facilitators: {
          select: {
            facilitator_id: true,
          },
        },
        documents: {
          select: {
            document_id: true,
          },
        },
      },
    });

    if (!readiness) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Readiness record not found", 404);
    }

    // Institution scoping (for INSTITUTION_* roles)
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (readiness.institution_id !== ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Access denied: Readiness record belongs to another institution",
          403
        );
      }
    }

    // Calculate completion
    const completion = calculateSectionCompletion(readiness);

    return NextResponse.json(completion, { status: 200 });
  } catch (error: any) {
    return fail(error);
  }
}

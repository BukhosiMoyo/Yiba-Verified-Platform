import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { validateReadinessForSubmission } from "@/lib/readinessCompletion";

interface RouteParams {
  params: Promise<{
    readinessId: string;
  }>;
}

/**
 * GET /api/institutions/readiness/[readinessId]/validate-submission
 * 
 * Validates readiness record before submission according to Form 5 requirements.
 * Returns validation errors and warnings.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { ctx } = await requireAuth(request);
    const { readinessId } = await params;

    // RBAC: Institution roles and PLATFORM_ADMIN can validate
    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions to validate readiness records", 403);
    }

    // Fetch readiness record with all related data
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
            document_type: true,
          },
        },
      },
    });

    if (!readiness) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Readiness record not found", 404);
    }

    // Institution scoping
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (readiness.institution_id !== ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Access denied: Readiness record belongs to another institution",
          403
        );
      }
    }

    // Validate readiness for submission
    const validation = validateReadinessForSubmission(readiness);

    return NextResponse.json(validation, { status: 200 });
  } catch (error: any) {
    return fail(error);
  }
}

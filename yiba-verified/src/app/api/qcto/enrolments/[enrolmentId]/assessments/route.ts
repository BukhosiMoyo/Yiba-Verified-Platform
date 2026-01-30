// GET /api/qcto/enrolments/[enrolmentId]/assessments - Get assessments for an enrolment
//
// Security rules:
// - QCTO_USER: can view if enrolment is in APPROVED submission/request
// - PLATFORM_ADMIN: can view any enrolment
//
// Returns:
// {
//   "assessments": [ ...assessments with results... ],
//   "summary": {
//     "total": number,
//     "average_percentage": number,
//     "pass_rate": number,
//     "by_type": { ... }
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { canAccessQctoData } from "@/lib/rbac";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { assertCanReadForQCTO } from "@/lib/api/qctoAccess";

interface RouteParams {
  params: Promise<{ enrolmentId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { enrolmentId } = await params;
  try {
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot view assessments`,
        403
      );
    }

    // Check access (throws if denied)
    try {
      await assertCanReadForQCTO(ctx, "ENROLMENT", enrolmentId);
    } catch (accessError: any) {
      console.error("Access check failed for enrolment:", enrolmentId, accessError);
      throw accessError;
    }

    // Fetch assessments with results
    const assessments = await prisma.assessment.findMany({
      where: {
        enrolment_id: enrolmentId,
        deleted_at: null,
      },
      include: {
        results: {
          include: {
            assessedByUser: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
      orderBy: { assessment_date: "desc" },
    });

    // Calculate summary statistics
    const allResults = assessments.flatMap((a) => a.results);
    const totalAssessments = assessments.length;
    const resultsWithPercentage = allResults.filter((r) => r.percentage !== null);
    const averagePercentage =
      resultsWithPercentage.length > 0
        ? resultsWithPercentage.reduce((sum, r) => sum + Number(r.percentage || 0), 0) /
          resultsWithPercentage.length
        : null;
    const passedCount = allResults.filter((r) => r.passed === true).length;
    const totalFailed = allResults.filter((r) => r.passed === false).length;
    const passRate = allResults.length > 0 ? (passedCount / allResults.length) * 100 : null;

    // Group by assessment type
    const byType: Record<string, number> = {};
    assessments.forEach((a) => {
      byType[a.assessment_type] = (byType[a.assessment_type] || 0) + 1;
    });

    return NextResponse.json(
      {
        assessments,
        summary: {
          total: totalAssessments,
          average_percentage: averagePercentage,
          pass_rate: passRate,
          total_passed: passedCount,
          total_failed: totalFailed,
          by_type: byType,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/qcto/enrolments/[enrolmentId]/assessments error:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      enrolmentId,
    });
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}

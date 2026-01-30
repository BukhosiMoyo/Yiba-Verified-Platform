// GET /api/qcto/learners/[learnerId]/academic-history - Get academic history for a learner
//
// Security rules:
// - QCTO_USER: can view if learner is in APPROVED submission/request
// - PLATFORM_ADMIN: can view any learner
//
// Returns:
// {
//   "enrolments": [ ...enrolments with assessments and modules... ],
//   "summary": {
//     "total_enrolments": number,
//     "total_assessments": number,
//     "average_percentage": number,
//     "overall_pass_rate": number,
//     "modules_completed": number,
//     "total_modules": number
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { canAccessQctoData } from "@/lib/rbac";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { assertCanReadForQCTO } from "@/lib/api/qctoAccess";

interface RouteParams {
  params: Promise<{ learnerId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { learnerId } = await params;
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot view academic history`,
        403
      );
    }

    // Check access (throws if denied)
    await assertCanReadForQCTO(ctx, "LEARNER", learnerId);

    // Fetch enrolments with assessments and module completions
    const enrolments = await prisma.enrolment.findMany({
      where: {
        learner_id: learnerId,
        deleted_at: null,
      },
      include: {
        qualification: {
          select: {
            qualification_id: true,
            name: true,
            code: true,
          },
        },
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
        assessments: {
          where: { deleted_at: null },
          include: {
            results: true,
          },
          orderBy: { assessment_date: "desc" },
        },
        moduleCompletions: {
          include: {
            facilitator: {
              select: {
                facilitator_id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
      orderBy: { start_date: "desc" },
    });

    // Calculate summary statistics across all enrolments
    const totalEnrolments = enrolments.length;
    const allAssessments = enrolments.flatMap((e) => e.assessments);
    const totalAssessments = allAssessments.length;
    const allResults = allAssessments.flatMap((a) => a.results);
    const resultsWithPercentage = allResults.filter((r) => r.percentage !== null);
    const averagePercentage =
      resultsWithPercentage.length > 0
        ? resultsWithPercentage.reduce((sum, r) => sum + Number(r.percentage || 0), 0) /
          resultsWithPercentage.length
        : null;
    const passedCount = allResults.filter((r) => r.passed === true).length;
    const overallPassRate = allResults.length > 0 ? (passedCount / allResults.length) * 100 : 0;

    const allModules = enrolments.flatMap((e) => e.moduleCompletions);
    const totalModules = allModules.length;
    const modulesCompleted = allModules.filter((m) => m.status === "COMPLETED").length;

    return NextResponse.json(
      {
        enrolments,
        summary: {
          total_enrolments: totalEnrolments,
          total_assessments: totalAssessments,
          average_percentage: averagePercentage,
          overall_pass_rate: overallPassRate,
          modules_completed: modulesCompleted,
          total_modules: totalModules,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/qcto/learners/[learnerId]/academic-history error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Failed to fetch academic history" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/institution/dashboard
 * 
 * Returns dashboard metrics and recent learners for the institution.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);
    const institutionId = ctx.institutionId;

    if (!institutionId) {
      return NextResponse.json(
        { error: "User is not associated with an institution", code: ERROR_CODES.FORBIDDEN },
        { status: 403 }
      );
    }

    // Fetch dashboard data in parallel
    const [
      activeLearnerCount,
      totalLearnerCount,
      thisMonthLearnerCount,
      readinessStats,
      documentCount,
      flaggedCount,
      recentLearners,
    ] = await Promise.all([
      // Active learners (enrolled in active enrolments)
      prisma.learner.count({
        where: {
          institution_id: institutionId,
          deleted_at: null,
          enrolments: {
            some: {
              enrolment_status: "ACTIVE",
              deleted_at: null,
            },
          },
        },
      }),
      // Total learners
      prisma.learner.count({
        where: {
          institution_id: institutionId,
          deleted_at: null,
        },
      }),
      // New learners this month
      prisma.learner.count({
        where: {
          institution_id: institutionId,
          deleted_at: null,
          created_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      // Readiness stats
      prisma.readiness.groupBy({
        by: ["readiness_status"],
        where: {
          institution_id: institutionId,
          deleted_at: null,
        },
        _count: true,
      }),
      // Document count
      prisma.document.count({
        where: {
          uploadedByUser: {
            institution_id: institutionId,
          },
        },
      }),
      // Flagged evidence count
      prisma.evidenceFlag.count({
        where: {
          status: "ACTIVE",
          document: {
            uploadedByUser: {
              institution_id: institutionId,
            },
          },
        },
      }),
      // Recent learners with their latest enrolment
      prisma.learner.findMany({
        where: {
          institution_id: institutionId,
          deleted_at: null,
        },
        orderBy: { created_at: "desc" },
        take: 5,
        select: {
          learner_id: true,
          first_name: true,
          last_name: true,
          national_id: true,
          created_at: true,
          enrolments: {
            where: { deleted_at: null },
            orderBy: { created_at: "desc" },
            take: 1,
            select: {
              enrolment_id: true,
              enrolment_status: true,
              created_at: true,
              qualification: {
                select: {
                  name: true,
                },
              },
              qualification_title: true,
            },
          },
        },
      }),
    ]);

    // Calculate readiness submitted count
    const submittedStatuses = ["SUBMITTED", "UNDER_REVIEW", "REVIEWED", "RECOMMENDED"];
    const submittedCount = readinessStats
      .filter((s) => submittedStatuses.includes(s.readiness_status))
      .reduce((acc, s) => acc + s._count, 0);
    const totalReadiness = readinessStats.reduce((acc, s) => acc + s._count, 0);

    return NextResponse.json({
      metrics: {
        activeLearners: activeLearnerCount || totalLearnerCount, // Fallback to total if no active enrolments
        newLearnersThisMonth: thisMonthLearnerCount,
        readinessSubmitted: submittedCount,
        readinessTotal: totalReadiness,
        documentCount,
        flaggedCount,
      },
      recentLearners: recentLearners.map((learner) => ({
        learner_id: learner.learner_id,
        name: `${learner.first_name} ${learner.last_name}`,
        national_id: learner.national_id,
        qualification: learner.enrolments[0]?.qualification?.name || learner.enrolments[0]?.qualification_title || "—",
        status: learner.enrolments[0]?.enrolment_status || "NOT_ENROLLED",
        enrolled_at: learner.enrolments[0]?.created_at?.toISOString() || learner.created_at.toISOString(),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

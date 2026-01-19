import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/qcto/stats
 * 
 * Returns QCTO-specific statistics for the dashboard.
 * 
 * Access Control:
 * - QCTO_USER: Can view their stats (submissions/requests they can access)
 * - PLATFORM_ADMIN: Can view all stats (app owners see everything! 🦸)
 * - Other roles: 403 Forbidden
 * 
 * Returns:
 * {
 *   submissions: {
 *     total: number,
 *     submitted: number,
 *     under_review: number,
 *     approved: number,
 *     rejected: number
 *   },
 *   requests: {
 *     total: number,
 *     pending: number,
 *     approved: number,
 *     rejected: number
 *   },
 *   recent_reviews: Submission[] // Recent submissions reviewed by this QCTO user
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and get context
    const { ctx } = await requireAuth(request);

    // RBAC: Only QCTO_USER and PLATFORM_ADMIN can view QCTO stats
    if (ctx.role !== "QCTO_USER" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO users and platform admins can view QCTO stats", 403);
    }

    // Build base where clause (all non-deleted submissions)
    const submissionsWhere: any = {
      deleted_at: null,
    };

    // QCTO_USER can see all submissions (they're reviewers), PLATFORM_ADMIN sees everything
    // No institution scoping needed for QCTO

    // Fetch submission stats in parallel
    const [
      submissionsTotal,
      submissionsSubmitted,
      submissionsUnderReview,
      submissionsApproved,
      submissionsRejected,
      requestsTotal,
      requestsPending,
      requestsApproved,
      requestsRejected,
      recentReviews,
    ] = await Promise.all([
      // Submissions - all statuses
      prisma.submission.count({ where: submissionsWhere }),
      prisma.submission.count({
        where: { ...submissionsWhere, status: "SUBMITTED" },
      }),
      prisma.submission.count({
        where: { ...submissionsWhere, status: "UNDER_REVIEW" },
      }),
      prisma.submission.count({
        where: { ...submissionsWhere, status: "APPROVED" },
      }),
      prisma.submission.count({
        where: { ...submissionsWhere, status: "REJECTED" },
      }),
      // QCTO Requests
      prisma.qCTORequest.count({ where: { deleted_at: null } }),
      prisma.qCTORequest.count({
        where: { deleted_at: null, status: "PENDING" },
      }),
      prisma.qCTORequest.count({
        where: { deleted_at: null, status: "APPROVED" },
      }),
      prisma.qCTORequest.count({
        where: { deleted_at: null, status: "REJECTED" },
      }),
      // Recent reviews - submissions reviewed by this user (if QCTO_USER)
      // For PLATFORM_ADMIN, show all recently reviewed submissions
      ctx.role === "QCTO_USER"
        ? prisma.submission.findMany({
            where: {
              ...submissionsWhere,
              reviewed_by: ctx.userId,
              reviewed_at: { not: null },
            },
            take: 5,
            orderBy: { reviewed_at: "desc" },
            include: {
              institution: {
                select: {
                  institution_id: true,
                  legal_name: true,
                  trading_name: true,
                },
              },
            },
          })
        : prisma.submission.findMany({
            where: {
              ...submissionsWhere,
              reviewed_at: { not: null },
            },
            take: 5,
            orderBy: { reviewed_at: "desc" },
            include: {
              institution: {
                select: {
                  institution_id: true,
                  legal_name: true,
                  trading_name: true,
                },
              },
            },
          }),
    ]);

    // Format recent reviews
    const formattedReviews = recentReviews.map((submission) => ({
      submission_id: submission.submission_id,
      title: submission.title,
      status: submission.status,
      submitted_at: submission.submitted_at?.toISOString() || null,
      reviewed_at: submission.reviewed_at?.toISOString() || null,
      institution: submission.institution
        ? {
            institution_id: submission.institution.institution_id,
            legal_name: submission.institution.legal_name,
            trading_name: submission.institution.trading_name,
          }
        : null,
    }));

    return NextResponse.json(
      {
        submissions: {
          total: submissionsTotal,
          submitted: submissionsSubmitted,
          under_review: submissionsUnderReview,
          approved: submissionsApproved,
          rejected: submissionsRejected,
          pending: submissionsSubmitted + submissionsUnderReview,
        },
        requests: {
          total: requestsTotal,
          pending: requestsPending,
          approved: requestsApproved,
          rejected: requestsRejected,
        },
        recent_reviews: formattedReviews,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return fail(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/platform-admin/stats
 * 
 * Returns platform-wide statistics for the admin dashboard.
 * 
 * Access Control:
 * - PLATFORM_ADMIN: Can view all stats
 * - Other roles: 403 Forbidden
 * 
 * Returns:
 * {
 *   institutions: { total: number, active: number },
 *   learners: { total: number, active: number },
 *   enrolments: { total: number, active: number },
 *   submissions: { total: number, pending: number, submitted: number, under_review: number },
 *   requests: { total: number, pending: number },
 *   users: { total: number, active: number },
 *   recent_activity: AuditLog[]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and get context
    const { ctx } = await requireAuth(request);

    // RBAC: Only PLATFORM_ADMIN can view stats
    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only platform admins can view stats", 403);
    }

    // Fetch all stats in parallel for better performance
    const [
      institutionsTotal,
      institutionsActive,
      learnersTotal,
      learnersActive,
      enrolmentsTotal,
      enrolmentsActive,
      submissionsTotal,
      submissionsPending,
      submissionsSubmitted,
      submissionsUnderReview,
      requestsTotal,
      requestsPending,
      usersTotal,
      usersActive,
      recentActivity,
    ] = await Promise.all([
      // Institutions
      prisma.institution.count({ where: { deleted_at: null } }),
      prisma.institution.count({
        where: { deleted_at: null, status: "APPROVED" },
      }),
      // Learners (no status field - all non-deleted learners are considered active)
      prisma.learner.count({ where: { deleted_at: null } }),
      prisma.learner.count({ where: { deleted_at: null } }), // Active = all non-deleted
      // Enrolments
      prisma.enrolment.count({ where: { deleted_at: null } }),
      prisma.enrolment.count({
        where: { deleted_at: null, enrolment_status: "ACTIVE" },
      }),
      // Submissions
      prisma.submission.count({ where: { deleted_at: null } }),
      prisma.submission.count({
        where: { deleted_at: null, status: "SUBMITTED" },
      }),
      prisma.submission.count({
        where: { deleted_at: null, status: "SUBMITTED" },
      }),
      prisma.submission.count({
        where: { deleted_at: null, status: "UNDER_REVIEW" },
      }),
      // QCTO Requests
      prisma.qCTORequest.count({ where: { deleted_at: null } }),
      prisma.qCTORequest.count({
        where: { deleted_at: null, status: "PENDING" },
      }),
      // Users
      prisma.user.count({ where: { deleted_at: null } }),
      prisma.user.count({
        where: { deleted_at: null, status: "ACTIVE" },
      }),
      // Recent Activity (last 10 audit log entries)
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { changed_at: "desc" },
        include: {
          changedBy: {
            select: {
              user_id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
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

    // Format recent activity
    const formattedActivity = recentActivity.map((log) => ({
      audit_id: log.audit_id,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      field_name: log.field_name,
      change_type: log.change_type,
      changed_at: log.changed_at.toISOString(),
      changed_by_user: log.changedBy
        ? {
            user_id: log.changedBy.user_id,
            email: log.changedBy.email,
            first_name: log.changedBy.first_name,
            last_name: log.changedBy.last_name,
          }
        : null,
      institution: log.institution
        ? {
            institution_id: log.institution.institution_id,
            legal_name: log.institution.legal_name,
            trading_name: log.institution.trading_name,
          }
        : null,
    }));

    return NextResponse.json(
      {
        institutions: {
          total: institutionsTotal,
          active: institutionsActive,
        },
        learners: {
          total: learnersTotal,
          active: learnersActive,
        },
        enrolments: {
          total: enrolmentsTotal,
          active: enrolmentsActive,
        },
        submissions: {
          total: submissionsTotal,
          pending: submissionsPending + submissionsUnderReview,
          submitted: submissionsSubmitted,
          under_review: submissionsUnderReview,
        },
        requests: {
          total: requestsTotal,
          pending: requestsPending,
        },
        users: {
          total: usersTotal,
          active: usersActive,
        },
        recent_activity: formattedActivity,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return fail(error);
  }
}

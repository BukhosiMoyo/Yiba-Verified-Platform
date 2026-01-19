import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QctoDashboardClient } from "./QctoDashboardClient";

/**
 * QCTO Dashboard
 * 
 * Displays QCTO-specific statistics and pending reviews.
 * - QCTO_USER: Can see all submissions they can review
 * - PLATFORM_ADMIN: Can see all submissions (app owners see everything! 🦸)
 * - Shows pending submissions, recent reviews, and requests
 */
export default async function QCTODashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userId = session.user.userId;

  // Only QCTO_USER and PLATFORM_ADMIN can access
  if (userRole !== "QCTO_USER" && userRole !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Build base where clause (all non-deleted submissions)
  const submissionsWhere: any = {
    deleted_at: null,
  };

  // Fetch stats in parallel
  const [
    submissionsTotal,
    submissionsSubmitted,
    submissionsUnderReview,
    submissionsApproved,
    submissionsRejected,
    requestsTotal,
    requestsPending,
    readinessSubmitted,
    readinessUnderReview,
    pendingSubmissions,
    recentReviews,
    pendingReadiness,
  ] = await Promise.all([
    // Submission counts
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
    // Request counts
    prisma.qCTORequest.count({ where: { deleted_at: null } }),
    prisma.qCTORequest.count({
      where: { deleted_at: null, status: "PENDING" },
    }),
    // Readiness counts
    prisma.readiness.count({
      where: { deleted_at: null, readiness_status: "SUBMITTED" },
    }),
    prisma.readiness.count({
      where: { deleted_at: null, readiness_status: "UNDER_REVIEW" },
    }),
    // Pending submissions (SUBMITTED or UNDER_REVIEW) - latest first
    prisma.submission.findMany({
      where: {
        ...submissionsWhere,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
      take: 10,
      orderBy: { submitted_at: "desc" },
      include: {
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
        submittedByUser: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    }),
    // Recent reviews - submissions reviewed by this user (if QCTO_USER) or all (if PLATFORM_ADMIN)
    userRole === "QCTO_USER"
      ? prisma.submission.findMany({
          where: {
            ...submissionsWhere,
            reviewed_by: userId,
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
    // Pending readiness records (SUBMITTED or UNDER_REVIEW) - latest first
    prisma.readiness.findMany({
      where: {
        deleted_at: null,
        readiness_status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
      take: 5,
      orderBy: { created_at: "desc" },
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

  return (
    <QctoDashboardClient
      userRole={userRole as "QCTO_USER" | "PLATFORM_ADMIN"}
      submissionsTotal={submissionsTotal}
      submissionsSubmitted={submissionsSubmitted}
      submissionsUnderReview={submissionsUnderReview}
      submissionsApproved={submissionsApproved}
      submissionsRejected={submissionsRejected}
      requestsTotal={requestsTotal}
      requestsPending={requestsPending}
      readinessSubmitted={readinessSubmitted}
      readinessUnderReview={readinessUnderReview}
      pendingSubmissions={pendingSubmissions}
      recentReviews={recentReviews}
      pendingReadiness={pendingReadiness}
    />
  );
}
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessQctoData } from "@/lib/rbac";
import { QctoDashboardClient } from "./QctoDashboardClient";
import type { ApiContext } from "@/lib/api/context";

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

  if (!canAccessQctoData(userRole)) {
    redirect("/unauthorized");
  }

  // Get province filter based on user's assigned provinces
  let provinceFilter: string[] | null = null;
  
  if (userRole !== "PLATFORM_ADMIN" && userRole !== "QCTO_SUPER_ADMIN") {
    // Get user's assigned provinces for province filtering
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { assigned_provinces: true },
    });
    
    if (user?.assigned_provinces && user.assigned_provinces.length > 0) {
      provinceFilter = user.assigned_provinces;
    } else {
      // No provinces assigned - return empty dashboard
      provinceFilter = [];
    }
  }

  // Build base where clause (all non-deleted submissions)
  const submissionsWhere: any = {
    deleted_at: null,
  };

  // Apply province filtering to submissions (via institution)
  if (provinceFilter !== null && provinceFilter.length > 0) {
    submissionsWhere.institution = {
      province: { in: provinceFilter },
    };
  } else if (provinceFilter !== null && provinceFilter.length === 0) {
    // No provinces assigned - return empty dashboard
    return (
      <QctoDashboardClient
        userRole={userRole as "QCTO_USER" | "QCTO_SUPER_ADMIN" | "QCTO_ADMIN" | "PLATFORM_ADMIN"}
        submissionsTotal={0}
        submissionsSubmitted={0}
        submissionsUnderReview={0}
        submissionsApproved={0}
        submissionsRejected={0}
        requestsTotal={0}
        requestsPending={0}
        readinessSubmitted={0}
        readinessUnderReview={0}
        pendingSubmissions={[]}
        recentReviews={[]}
        pendingReadiness={[]}
      />
    );
  }

  // Build requests where clause
  const requestsWhere: any = {
    deleted_at: null,
  };

  // Apply province filtering to requests (via institution)
  if (provinceFilter !== null && provinceFilter.length > 0) {
    requestsWhere.institution = {
      province: { in: provinceFilter },
    };
  }

  // Build readiness where clause
  const readinessWhere: any = {
    deleted_at: null,
  };

  // Apply province filtering to readiness (via institution)
  if (provinceFilter !== null && provinceFilter.length > 0) {
    readinessWhere.institution = {
      province: { in: provinceFilter },
    };
  }

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
    prisma.qCTORequest.count({ where: requestsWhere }),
    prisma.qCTORequest.count({
      where: { ...requestsWhere, status: "PENDING" },
    }),
    // Readiness counts
    prisma.readiness.count({
      where: { ...readinessWhere, readiness_status: "SUBMITTED" },
    }),
    prisma.readiness.count({
      where: { ...readinessWhere, readiness_status: "UNDER_REVIEW" },
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
        ...readinessWhere,
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
      userRole={userRole as "QCTO_USER" | "QCTO_SUPER_ADMIN" | "QCTO_ADMIN" | "PLATFORM_ADMIN"}
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
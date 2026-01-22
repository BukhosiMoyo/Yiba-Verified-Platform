import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlatformAdminDashboardClient } from "./PlatformAdminDashboardClient";

/**
 * Platform Admin Dashboard
 * 
 * Displays real-time platform statistics and recent activity.
 * - Only PLATFORM_ADMIN can access
 * - Shows actual counts from database
 * - Recent activity from audit logs
 */
export default async function PlatformAdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Fetch all stats in parallel for better performance
  // Wrap in try-catch to handle database connection errors gracefully
  let institutionsTotal = 0;
  let institutionsActive = 0;
  let learnersTotal = 0;
  let learnersActive = 0;
  let enrolmentsTotal = 0;
  let enrolmentsActive = 0;
  let submissionsTotal = 0;
  let submissionsPending = 0;
  let submissionsUnderReview = 0;
  let requestsTotal = 0;
  let requestsPending = 0;
  let usersTotal = 0;
  let usersActive = 0;
  let invitesSent7d = 0;
  let invitesAccepted = 0;
  let pendingInvites = 0;
  let invitesSentAllTime = 0;
  let recentActivity: any[] = [];
  let avgReviewTimeDays = 0;
  let avgReviewTimeTrend = 0;
  let overdueSubmissions = 0;
  let submissionsReturned = 0;
  let submissionsApproved = 0;
  let submissionsToday = 0;
  let databaseStatus: "healthy" | "degraded" | "down" = "healthy";
  let recentErrors = 0;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let dailyActiveUsers: number[] = [0, 0, 0, 0, 0, 0, 0];
  let weeklyActiveInstitutions: number[] = [0, 0, 0, 0, 0, 0, 0];
  let engagementLabels: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  try {
    [
      institutionsTotal,
      institutionsActive,
      learnersTotal,
      learnersActive,
      enrolmentsTotal,
      enrolmentsActive,
      submissionsTotal,
      submissionsPending,
      submissionsUnderReview,
      requestsTotal,
      requestsPending,
      usersTotal,
      usersActive,
      invitesSent7d,
      invitesAccepted,
      pendingInvites,
      invitesSentAllTime,
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
      // Invites (Growth & Adoption KPIs)
      prisma.invite.count({
        where: { deleted_at: null, sent_at: { not: null, gte: sevenDaysAgo } },
      }),
      prisma.invite.count({
        where: { deleted_at: null, accepted_at: { not: null } },
      }),
      prisma.invite.count({
        where: {
          deleted_at: null,
          accepted_at: null,
          expires_at: { gt: new Date() },
        },
      }),
      prisma.invite.count({
        where: { deleted_at: null, sent_at: { not: null } },
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

    // Engagement: last 7 days (DAU, WAI) from audit logs
    const dayKeys = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    engagementLabels = dayKeys.map(
      (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short" })
    );

    const [dauLogs, waiLogs] = await Promise.all([
      prisma.auditLog.findMany({
        where: { changed_at: { gte: sevenDaysAgo } },
        select: { changed_at: true, changed_by: true },
      }),
      prisma.auditLog.findMany({
        where: { changed_at: { gte: sevenDaysAgo }, institution_id: { not: null } },
        select: { changed_at: true, institution_id: true },
      }),
    ]);

    const dauByDay: Record<number, Set<string>> = {};
    const waiByDay: Record<number, Set<string>> = {};
    dayKeys.forEach((_, i) => {
      dauByDay[i] = new Set();
      waiByDay[i] = new Set();
    });

    for (const log of dauLogs) {
      const d = new Date(log.changed_at).toISOString().slice(0, 10);
      const i = dayKeys.indexOf(d);
      if (i >= 0) dauByDay[i].add(log.changed_by);
    }
    for (const log of waiLogs) {
      const d = new Date(log.changed_at).toISOString().slice(0, 10);
      const i = dayKeys.indexOf(d);
      if (i >= 0 && log.institution_id) waiByDay[i].add(log.institution_id);
    }

    dailyActiveUsers = dayKeys.map((_, i) => dauByDay[i].size);
    weeklyActiveInstitutions = dayKeys.map((_, i) => waiByDay[i].size);

    // Workflow Efficiency Metrics
    // 1. Average Review Time (last 30 days vs previous 30 days for trend)
    const reviewedSubmissions = await prisma.submission.findMany({
      where: {
        deleted_at: null,
        reviewed_at: { not: null },
        submitted_at: { not: null },
      },
      select: {
        submitted_at: true,
        reviewed_at: true,
      },
    });

    if (reviewedSubmissions.length > 0) {
      // Calculate average review time for all reviewed submissions
      const totalMs = reviewedSubmissions.reduce((sum, s) => {
        if (s.submitted_at && s.reviewed_at) {
          return sum + (s.reviewed_at.getTime() - s.submitted_at.getTime());
        }
        return sum;
      }, 0);
      avgReviewTimeDays = totalMs / reviewedSubmissions.length / (1000 * 60 * 60 * 24);

      // Calculate trend: last 30 days vs previous 30 days
      const recentSubmissions = reviewedSubmissions.filter(
        (s) => s.reviewed_at && s.reviewed_at >= thirtyDaysAgo && s.reviewed_at < new Date()
      );
      const previousSubmissions = reviewedSubmissions.filter(
        (s) => s.reviewed_at && s.reviewed_at >= sixtyDaysAgo && s.reviewed_at < thirtyDaysAgo
      );

      if (recentSubmissions.length > 0 && previousSubmissions.length > 0) {
        const recentAvg =
          recentSubmissions.reduce((sum, s) => {
            if (s.submitted_at && s.reviewed_at) {
              return sum + (s.reviewed_at.getTime() - s.submitted_at.getTime());
            }
            return sum;
          }, 0) /
          recentSubmissions.length /
          (1000 * 60 * 60 * 24);

        const previousAvg =
          previousSubmissions.reduce((sum, s) => {
            if (s.submitted_at && s.reviewed_at) {
              return sum + (s.reviewed_at.getTime() - s.submitted_at.getTime());
            }
            return sum;
          }, 0) /
          previousSubmissions.length /
          (1000 * 60 * 60 * 24);

        avgReviewTimeTrend = recentAvg - previousAvg;
      }
    }

    // 2. Overdue Submissions (submitted more than 7 days ago, still pending)
    overdueSubmissions = await prisma.submission.count({
      where: {
        deleted_at: null,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        submitted_at: { not: null, lt: sevenDaysAgoDate },
      },
    });

    // 3. Returned vs Approved counts
    submissionsReturned = await prisma.submission.count({
      where: {
        deleted_at: null,
        status: "RETURNED_FOR_CORRECTION",
      },
    });

    submissionsApproved = await prisma.submission.count({
      where: {
        deleted_at: null,
        status: "APPROVED",
      },
    });

    // Submissions submitted today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    submissionsToday = await prisma.submission.count({
      where: {
        deleted_at: null,
        submitted_at: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // System Health Metrics
    // Database status check - perform a simple health check query
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = "healthy";
      recentErrors = 0;
    } catch (dbError) {
      console.error("Database health check failed:", dbError);
      databaseStatus = "down";
      recentErrors = 1;
    }
  } catch (error) {
    // Log error but don't crash - allow page to render with default values
    console.error("Database connection error:", error);
    // If we can't connect to database, mark it as down
    databaseStatus = "down";
    recentErrors = 1;
    // Values already initialized to defaults above
  }

  const acceptanceRate =
    invitesSentAllTime > 0
      ? Math.round((invitesAccepted / invitesSentAllTime) * 100)
      : 0;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Format today's date
  const formatTodayDate = () => {
    return new Intl.DateTimeFormat("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());
  };

  const userName = session.user.name || "there";
  const greeting = getGreeting();
  const todayDate = formatTodayDate();

  return (
    <PlatformAdminDashboardClient
      greeting={greeting}
      userName={userName}
      todayDate={todayDate}
      institutionsTotal={institutionsTotal}
      institutionsActive={institutionsActive}
      learnersTotal={learnersTotal}
      learnersActive={learnersActive}
      enrolmentsTotal={enrolmentsTotal}
      enrolmentsActive={enrolmentsActive}
      submissionsTotal={submissionsTotal}
      submissionsPending={submissionsPending}
      submissionsUnderReview={submissionsUnderReview}
      requestsTotal={requestsTotal}
      requestsPending={requestsPending}
      usersTotal={usersTotal}
      usersActive={usersActive}
      invitesSent7d={invitesSent7d}
      invitesAccepted={invitesAccepted}
      pendingInvites={pendingInvites}
      acceptanceRate={acceptanceRate}
      recentActivity={recentActivity}
      dailyActiveUsers={dailyActiveUsers}
      weeklyActiveInstitutions={weeklyActiveInstitutions}
      engagementLabels={engagementLabels}
      avgReviewTimeDays={avgReviewTimeDays}
      avgReviewTimeTrend={avgReviewTimeTrend}
      overdueSubmissions={overdueSubmissions}
      submissionsReturned={submissionsReturned}
      submissionsApproved={submissionsApproved}
      submissionsToday={submissionsToday}
      databaseStatus={databaseStatus}
      recentErrors={recentErrors}
      lastChecked={new Date().toISOString()}
    />
  );
}

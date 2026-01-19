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
  let recentActivity: any[] = [];

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
  } catch (error) {
    // Log error but don't crash - allow page to render with default values
    console.error("Database connection error:", error);
    // Values already initialized to defaults above
  }

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
      recentActivity={recentActivity}
    />
  );
}

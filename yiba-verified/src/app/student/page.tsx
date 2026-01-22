import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentDashboardMetrics } from "@/components/student/StudentDashboardMetrics";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatTodayDate() {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  // Check onboarding status - redirect if not completed
  const user = await prisma.user.findUnique({
    where: { user_id: session.user.userId },
    select: {
      onboarding_completed: true,
    },
  });

  if (!user?.onboarding_completed) {
    redirect("/student/onboarding");
  }

  const userName = session?.user?.name || "there";
  const greeting = getGreeting();
  const todayDate = formatTodayDate();

  // Fetch student's learner record and enrolments
  const learner = await prisma.learner.findUnique({
    where: { user_id: session.user.userId },
    include: {
      enrolments: {
        where: { deleted_at: null },
        include: {
          institution: {
            select: {
              trading_name: true,
              legal_name: true,
            },
          },
          qualification: {
            select: {
              name: true,
            },
          },
          attendanceRecords: {
            orderBy: { marked_at: "desc" },
            take: 10,
            include: {
              markedByUser: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
        orderBy: { start_date: "desc" },
        take: 5,
      },
    },
  });

  // Build recent updates from real data
  const recentUpdates: Array<{
    type: "attendance" | "enrolment" | "certificate";
    message: string;
    date: Date;
    qualification?: string;
  }> = [];

  if (learner) {
    // Add recent attendance updates
    for (const enrolment of learner.enrolments) {
      const recentAttendance = enrolment.attendanceRecords.slice(0, 3);
      for (const record of recentAttendance) {
        const qualificationName = enrolment.qualification?.name || enrolment.qualification_title;
        recentUpdates.push({
          type: "attendance",
          message: `Attendance updated — ${qualificationName}`,
          date: record.marked_at,
          qualification: qualificationName,
        });
      }

      // Add enrolment creation
      recentUpdates.push({
        type: "enrolment",
        message: `Enrolled — ${enrolment.qualification?.name || enrolment.qualification_title} at ${enrolment.institution.trading_name || enrolment.institution.legal_name}`,
        date: enrolment.created_at,
        qualification: enrolment.qualification?.name || enrolment.qualification_title,
      });
    }
  }

  // Sort by date (most recent first) and limit to 5
  recentUpdates.sort((a, b) => b.date.getTime() - a.date.getTime());
  const displayUpdates = recentUpdates.slice(0, 5);

  // Format relative time
  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks === 1) return "1 week ago";
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    if (diffMonths === 1) return "1 month ago";
    if (diffMonths < 12) return `${diffMonths} months ago`;
    return `${Math.floor(diffMonths / 12)} year${Math.floor(diffMonths / 12) > 1 ? "s" : ""} ago`;
  }

  // Calculate real metrics from learner data
  const activeEnrolments = learner?.enrolments.filter(e => e.enrolment_status === "ACTIVE") || [];
  const completedEnrolments = learner?.enrolments.filter(e => e.enrolment_status === "COMPLETED") || [];
  
  // Calculate average attendance from active enrolments
  const attendanceValues = activeEnrolments
    .map(e => e.attendance_percentage ? Number(e.attendance_percentage) : null)
    .filter((v): v is number => v !== null);
  const avgAttendance = attendanceValues.length > 0
    ? Math.round(attendanceValues.reduce((sum, val) => sum + val, 0) / attendanceValues.length)
    : null;

  // Calculate average progress (using attendance as proxy for now)
  const avgProgress = avgAttendance;

  const metrics = {
    activeEnrolments: activeEnrolments.length,
    attendance: avgAttendance,
    certificates: completedEnrolments.length,
    progress: avgProgress,
  };

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8">
      {/* Greeting — violet gradient banner; inline background so it’s not white-on-white if Tailwind is cached/missing */}
      <div
        className="relative z-10 overflow-hidden rounded-2xl px-6 py-8 md:px-8 md:py-10 shadow-lg"
        style={{
          background: "linear-gradient(to bottom right, #8b5cf6 0%, #7c3aed 50%, #4338ca 100%)",
          color: "#ffffff",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at top right, rgba(255,255,255,0.18) 0%, transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#ffffff" }}>
            {greeting}, {userName}
          </h1>
          <p className="text-sm md:text-base" style={{ color: "rgba(255,255,255,0.92)" }}>
            Today is {todayDate}
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.82)" }}>
            Your learning progress and enrolment information
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="relative">
        <StudentDashboardMetrics metrics={metrics} />
      </div>

      {/* My Profile & CV */}
      <Card className="relative overflow-hidden border border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border bg-gradient-to-b from-muted/50 to-transparent">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">My Profile & CV</CardTitle>
              <CardDescription>View and share your verified CV</CardDescription>
            </div>
            <Link
              href="/student/profile"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              View
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            Your verified CV, ready to download and share with employers.
          </p>
        </CardContent>
      </Card>

      {/* My Enrolments Table */}
      <Card className="relative overflow-hidden border border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border bg-gradient-to-b from-muted/50 to-transparent">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">My Enrolments</CardTitle>
              <CardDescription>Your current and past enrolments</CardDescription>
            </div>
            <Link
              href="/student/enrolments"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="border-collapse [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border">
              <TableHeader>
                <TableRow className="bg-muted/80 border-b border-border hover:bg-muted/80">
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground py-2.5 px-4 min-w-[140px]">
                    Qualification
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground py-2.5 px-4 min-w-[160px]">
                    Institution
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground py-2.5 px-4 w-[120px] whitespace-nowrap">
                    Start date
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground py-2.5 px-4 w-[100px]">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground py-2.5 px-4 w-[100px]">
                    Progress
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {learner && learner.enrolments.length > 0 ? (
                  learner.enrolments.map((enrolment) => {
                    const statusColors = {
                      ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/60",
                      COMPLETED: "bg-muted text-muted-foreground border-border",
                      TRANSFERRED: "bg-amber-100 text-amber-800 border-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/60",
                      ARCHIVED: "bg-gray-100 text-gray-800 border-gray-200/60 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800/60",
                    };
                    const attendancePercent = enrolment.attendance_percentage
                      ? Number(enrolment.attendance_percentage)
                      : null;

                    return (
                      <TableRow key={enrolment.enrolment_id} className="group hover:bg-violet-50/40 dark:hover:bg-violet-950/20 transition-colors">
                        <TableCell className="font-medium text-foreground py-2.5 px-4">
                          {enrolment.qualification?.name || enrolment.qualification_title}
                        </TableCell>
                        <TableCell className="text-foreground py-2.5 px-4">
                          {enrolment.institution.trading_name || enrolment.institution.legal_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground py-2.5 px-4 whitespace-nowrap">
                          {new Date(enrolment.start_date).toLocaleDateString("en-ZA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              statusColors[enrolment.enrolment_status] || statusColors.ARCHIVED
                            }`}
                          >
                            {enrolment.enrolment_status}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 px-4">
                          {attendancePercent !== null ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800 border border-violet-200/60 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800/60">
                              {attendancePercent}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No enrolments yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <Card className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border bg-gradient-to-b from-muted/40 to-transparent pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Updates</CardTitle>
          <CardDescription>Latest information about your enrolments</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {displayUpdates.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-300 via-violet-200 to-transparent dark:from-violet-600 dark:via-violet-800" aria-hidden />
              <div className="space-y-0">
                {displayUpdates.map((update, index) => (
                  <div key={index} className="flex items-start gap-4 pl-1">
                    <div className="mt-2 h-2.5 w-2.5 rounded-full bg-violet-500 ring-4 ring-violet-100 dark:ring-violet-900/30 flex-shrink-0" />
                    <div className={`flex-1 min-w-0 ${index < displayUpdates.length - 1 ? "pb-5" : ""}`}>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{update.message.split(" — ")[0]}</span>
                        {update.qualification && (
                          <span className="text-muted-foreground"> — {update.qualification}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(update.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No recent updates yet</p>
              <p className="text-xs mt-1">Updates about your enrolments and attendance will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

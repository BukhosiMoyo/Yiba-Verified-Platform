"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { GraduationCap, FileCheck, FileText, AlertCircle, Hand, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type {
  ActivityItem,
  DashboardMetrics,
  RecentLearnerItem,
} from "@/lib/institution-dashboard-data";

const activityConfig = {
  learner: {
    icon: GraduationCap,
    bgColor: "bg-amber-50 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-50 dark:bg-amber-900/40",
    badgeText: "text-amber-700 dark:text-amber-300",
    label: "Learner",
  },
  document: {
    icon: FileText,
    bgColor: "bg-emerald-50 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-50 dark:bg-emerald-900/40",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    label: "Evidence",
  },
  readiness: {
    icon: FileCheck,
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-50 dark:bg-blue-900/40",
    badgeText: "text-blue-700 dark:text-blue-300",
    label: "Readiness",
  },
  enrolment: {
    icon: UserPlus,
    bgColor: "bg-purple-50 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-50 dark:bg-purple-900/40",
    badgeText: "text-purple-700 dark:text-purple-300",
    label: "Enrolment",
  },
};

const statusLabels: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" },
  COMPLETED: { label: "Completed", className: "bg-muted text-muted-foreground" },
  WITHDRAWN: { label: "Withdrawn", className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  SUSPENDED: { label: "Suspended", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  NOT_ENROLLED: { label: "Not Enrolled", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

export interface InstitutionDashboardClientProps {
  greeting: string;
  userName: string;
  todayDate: string;
  activities: ActivityItem[];
  metrics: DashboardMetrics | null;
  recentLearners: RecentLearnerItem[];
}

export function InstitutionDashboardClient({
  greeting,
  userName,
  todayDate,
  activities,
  metrics,
  recentLearners,
}: InstitutionDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Greeting section */}
      <div className="rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            {greeting}, {userName}{" "}
            <Hand className="inline-block h-5 w-5 text-muted-foreground ml-1 align-middle" aria-hidden />
          </h1>
          <p className="text-sm text-muted-foreground">
            Today is {todayDate}
          </p>
          <p className="text-sm text-muted-foreground">
            Overview of your institution&apos;s compliance and learner management
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title="Active Learners"
          value={metrics == null ? "—" : String(metrics.activeLearners ?? 0)}
          subtext={metrics == null ? "—" : `+${metrics.newLearnersThisMonth ?? 0} this month`}
          colorVariant="blue"
          trendTint="blue"
          icon={GraduationCap}
          trendPlaceholder="—"
        />
        <DashboardMetricCard
          title="Readiness Status"
          value={
            metrics == null
              ? "—"
              : `${metrics.readinessSubmitted ?? 0}/${metrics.readinessTotal ?? 0}`
          }
          subtext="Submitted for review"
          colorVariant="green"
          trendTint="green"
          icon={FileCheck}
          trendPlaceholder="—"
        />
        <DashboardMetricCard
          title="Evidence Documents"
          value={metrics == null ? "—" : String(metrics.documentCount ?? 0)}
          subtext="Total uploaded"
          colorVariant="purple"
          trendTint="blue"
          icon={FileText}
          trendPlaceholder="—"
        />
        <DashboardMetricCard
          title="Flagged Items"
          value={metrics == null ? "—" : String(metrics.flaggedCount ?? 0)}
          subtext="Requires attention"
          colorVariant="amber"
          trendTint="amber"
          icon={AlertCircle}
          trendPlaceholder="—"
        />
      </div>

      {/* Recent Learners Table */}
      <Card className="overflow-hidden border border-border bg-card shadow-sm dark:shadow-none">
        <CardHeader className="bg-gradient-to-b from-muted/40 to-transparent dark:from-muted/20 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Recent Learners</CardTitle>
            <CardDescription>Recently added or updated learners</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {recentLearners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <GraduationCap className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No learners yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Learners will appear here once you add them
              </p>
            </div>
          ) : (
            <ResponsiveTable>
              <Table className="border-collapse [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border">
                <TableHeader>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="bg-muted/60 dark:bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                    <TableHead className="bg-muted/60 dark:bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">National ID</TableHead>
                    <TableHead className="bg-muted/60 dark:bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Qualification</TableHead>
                    <TableHead className="bg-muted/60 dark:bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="bg-muted/60 dark:bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Enrolled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLearners.map((learner) => {
                    const statusConfig = statusLabels[learner.status] ?? statusLabels.NOT_ENROLLED;
                    return (
                      <TableRow key={learner.learner_id} className="group hover:bg-accent/50 transition-colors">
                        <TableCell className="font-medium text-foreground py-3.5">{learner.name}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-[13px] py-3.5">
                          {learner.national_id ?? "—"}
                        </TableCell>
                        <TableCell className="text-foreground/80 py-3.5">{learner.qualification}</TableCell>
                        <TableCell className="py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}
                          >
                            {statusConfig.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground py-3.5">
                          {new Date(learner.enrolled_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:shadow-none">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
          <CardDescription>Latest changes and updates</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <FileCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity will appear here as you manage learners and documents
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map((activity) => {
                const config = activityConfig[activity.type];
                const Icon = config.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-accent/50"
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}
                    >
                      <Icon className={`h-4 w-4 ${config.iconColor}`} strokeWidth={2} aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{activity.title}</span>
                        <span
                          className={`inline-flex items-center rounded-md ${config.badgeBg} px-1.5 py-0.5 text-[11px] font-medium ${config.badgeText}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground truncate">{activity.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

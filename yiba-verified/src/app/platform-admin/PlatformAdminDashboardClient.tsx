"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Building2, Users, ClipboardList, GraduationCap, Activity, Mail, Clock, FileText, CheckCircle2, ArrowUpRight, Hand, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { DashboardModeToggle } from "@/components/dashboard/DashboardModeToggle";
import { useDashboardMode } from "@/hooks/useDashboardMode";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SystemSnapshotCard } from "@/components/dashboard/SystemSnapshotCard";
import { SystemHealthCard } from "@/components/dashboard/SystemHealthCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { formatFieldLabel } from "@/lib/audit-display";

interface PlatformAdminDashboardClientProps {
  greeting: string;
  userName: string;
  todayDate: string;
  institutionsTotal: number;
  institutionsActive: number;
  learnersTotal: number;
  learnersActive: number;
  enrolmentsTotal: number;
  enrolmentsActive: number;
  submissionsTotal: number;
  submissionsPending: number;
  submissionsUnderReview: number;
  requestsTotal: number;
  requestsPending: number;
  usersTotal: number;
  usersActive: number;
  invitesSent7d: number;
  invitesAccepted: number;
  pendingInvites: number;
  acceptanceRate: number;
  recentActivity: any[];
  dailyActiveUsers: number[];
  weeklyActiveInstitutions: number[];
  engagementLabels: string[];
  avgReviewTimeDays: number;
  avgReviewTimeTrend: number;
  overdueSubmissions: number;
  submissionsReturned: number;
  submissionsApproved: number;
  submissionsToday: number;
  databaseStatus: "healthy" | "degraded" | "down";
  recentErrors: number;
  lastChecked: string;
  recentClientErrors: Array<{
    id: string;
    message: string;
    path: string | null;
    digest: string | null;
    created_at: Date;
    user?: { email: string; first_name: string; last_name: string } | null;
  }>;
}

export function PlatformAdminDashboardClient({
  greeting,
  userName,
  todayDate,
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
  acceptanceRate,
  recentActivity,
  dailyActiveUsers,
  weeklyActiveInstitutions,
  engagementLabels,
  avgReviewTimeDays,
  avgReviewTimeTrend,
  overdueSubmissions,
  submissionsReturned,
  submissionsApproved,
  submissionsToday,
  databaseStatus,
  recentErrors,
  lastChecked,
  recentClientErrors,
}: PlatformAdminDashboardClientProps) {
  const { mode, setMode } = useDashboardMode();

  const pendingReviews = submissionsPending + submissionsUnderReview + requestsPending;
  const lastUpdated = "just now";

  // Format change type for display
  const formatChangeType = (changeType: string) => {
    switch (changeType) {
      case "CREATE":
        return "Created";
      case "UPDATE":
        return "Updated";
      case "DELETE":
        return "Deleted";
      case "STATUS_CHANGE":
        return "Status Changed";
      default:
        return changeType;
    }
  };

  // Format entity type for display
  const formatEntityType = (entityType: string) => {
    return entityType.charAt(0) + entityType.slice(1).toLowerCase();
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Format review time for display
  const formatReviewTime = (days: number) => {
    if (days === 0) return "0 days";
    if (days < 1) return `${Math.round(days * 24 * 10) / 10} hours`;
    return `${Math.round(days * 10) / 10} days`;
  };

  // Calculate returned vs approved ratio
  const getReturnedApprovedRatio = () => {
    if (submissionsApproved === 0 && submissionsReturned === 0) {
      return { value: 0, label: "0:0 (no data)" };
    }
    if (submissionsApproved === 0 && submissionsReturned > 0) {
      return { value: submissionsReturned, label: `${submissionsReturned}:0` };
    }
    const ratio = submissionsReturned / submissionsApproved;
    return {
      value: Math.round(ratio * 100) / 100,
      label: `${submissionsReturned}:${submissionsApproved}`,
    };
  };

  const returnedApprovedRatio = getReturnedApprovedRatio();

  return (
    <div className="space-y-6">
          {/* Dashboard Header Hero */}
          <div className="rounded-2xl border border-border bg-card px-6 py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Left: Greeting Section */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
                      {greeting}, {userName}{" "}
                      <Hand className="inline-block h-5 w-5 text-muted-foreground ml-1 align-middle" aria-hidden />
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {todayDate}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Here's what's happening today.
                    </p>
                  </div>
                  {/* Toggle in top-right on larger screens */}
                  <div className="hidden md:block flex-shrink-0">
                    <DashboardModeToggle mode={mode} onChange={setMode} />
                  </div>
                </div>
              </div>
              {/* Right: Meta Chips + Toggle on mobile */}
              <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-2">
                {/* Toggle on mobile - stack above chips */}
                <div className="md:hidden w-full flex justify-end mb-1">
                  <DashboardModeToggle mode={mode} onChange={setMode} />
                </div>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  Today
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  Platform Overview
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  Updated: {lastUpdated}
                </span>
              </div>
            </div>
          </div>

          {/* LITE MODE: Primary Health Metrics + System Snapshot */}
          {mode === "lite" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: 2x2 Grid (2/3 width) */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Active Institutions */}
                <MetricCard
                  title="Active Institutions"
                  value={institutionsActive}
                  icon={Building2}
                  subtitle={`${institutionsTotal} total`}
                  accent="blue"
                  delta={{
                    value: 5.2,
                    label: "+5 today",
                    trend: "up",
                  }}
                />

                {/* Active Users */}
                <MetricCard
                  title="Active Users"
                  value={usersActive}
                  icon={Users}
                  subtitle={`${usersTotal} total`}
                  accent="indigo"
                  delta={{
                    value: 12.1,
                    label: "+12 since yesterday",
                    trend: "up",
                  }}
                />

                {/* Active Learners */}
                <MetricCard
                  title="Active Learners"
                  value={learnersActive}
                  icon={GraduationCap}
                  subtitle={`${learnersTotal} total`}
                  accent="amber"
                  delta={{
                    value: 8.7,
                    label: "+8.7%",
                    trend: "up",
                  }}
                />

                {/* Pending Reviews */}
                <MetricCard
                  title="Pending Reviews"
                  value={pendingReviews}
                  icon={ClipboardList}
                  subtitle={`${submissionsPending + submissionsUnderReview} submissions`}
                  accent="purple"
                  delta={{
                    value: -3.5,
                    label: "-2 since yesterday",
                    trend: "down",
                  }}
                />
              </div>

              {/* Right: System Snapshot (1/3 width) */}
              <div className="lg:col-span-1">
                <SystemSnapshotCard className="h-full" avgReviewTimeDays={avgReviewTimeDays} />
              </div>
            </div>
          )}

          {/* ADVANCED MODE: Growth & Adoption KPIs, Engagement Analytics, Workflow Efficiency, System Health */}
          {mode === "advanced" && (
            <div className="space-y-6">
              {/* SECTION A: Growth & Adoption KPIs */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Growth & Adoption KPIs</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <MetricCard
                    title="Invites Sent (7 days)"
                    value={invitesSent7d}
                    icon={Mail}
                    subtitle="in last 7 days"
                  />
                  <MetricCard
                    title="Invites Accepted"
                    value={invitesAccepted}
                    icon={CheckCircle2}
                    subtitle="all time"
                  />
                  <MetricCard
                    title="Pending Invites"
                    value={pendingInvites}
                    icon={Mail}
                    subtitle="not expired"
                  />
                  <MetricCard
                    title="Acceptance Rate %"
                    value={acceptanceRate}
                    icon={ArrowUpRight}
                    subtitle="of invites sent"
                  />
                  <MetricCard
                    title="Institutions Onboarded (30d)"
                    value={institutionsActive}
                    icon={Building2}
                    subtitle={`${institutionsTotal} total`}
                    delta={{
                      value: 5,
                      label: "+5 this month",
                      trend: "up",
                    }}
                  />
                </div>
              </div>

              {/* SECTION B: Engagement Analytics */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Engagement Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChartPlaceholder
                    title="Daily Active Users"
                    description="Distinct users with audit activity over the past 7 days"
                    type="line"
                    data={dailyActiveUsers}
                    labels={engagementLabels}
                  />
                  <ChartPlaceholder
                    title="Weekly Active Institutions"
                    description="Distinct institutions with audit activity over the past 7 days"
                    type="bar"
                    data={weeklyActiveInstitutions}
                    labels={engagementLabels}
                  />
                </div>
              </div>

              {/* SECTION C: Workflow Efficiency + System Health */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Workflow Efficiency KPIs */}
                <div className="lg:col-span-3 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Workflow Efficiency</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                      title="Avg Review Time"
                      value={Math.round(avgReviewTimeDays * 10) / 10}
                      icon={Clock}
                      subtitle={formatReviewTime(avgReviewTimeDays)}
                      delta={
                        avgReviewTimeTrend !== 0
                          ? {
                              value: Math.abs(Math.round(avgReviewTimeTrend * 10) / 10),
                              label: `${avgReviewTimeTrend > 0 ? "+" : ""}${Math.round(avgReviewTimeTrend * 10) / 10} days`,
                              trend: avgReviewTimeTrend < 0 ? "up" : "down",
                            }
                          : undefined
                      }
                    />
                    <MetricCard
                      title="Submissions Today"
                      value={submissionsToday}
                      icon={FileText}
                      subtitle={`${submissionsTotal} total`}
                    />
                    <MetricCard
                      title="Overdue Submissions"
                      value={overdueSubmissions}
                      icon={ClipboardList}
                      subtitle={overdueSubmissions > 0 ? "> 7 days overdue" : "None overdue"}
                    />
                    <MetricCard
                      title="Returned vs Approved"
                      value={returnedApprovedRatio.value}
                      icon={CheckCircle2}
                      subtitle={returnedApprovedRatio.label}
                    />
                  </div>
                </div>

                {/* System Health Panel */}
                <div className="lg:col-span-1">
                  <SystemHealthCard 
                    databaseStatus={databaseStatus}
                    recentErrors={recentErrors}
                    lastChecked={lastChecked}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recent Client Errors - from error boundary reports */}
          <Card className="bg-card rounded-xl border border-border">
            <CardHeader className="px-6 pt-6 pb-4 border-b border-border/60">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">Recent Errors</CardTitle>
                  <CardDescription className="mt-1 text-sm text-muted-foreground">
                    Client-side errors reported by users (last 24h)
                  </CardDescription>
                </div>
                <Link
                  href="/platform-admin/errors"
                  className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors duration-150"
                >
                  View all errors
                  <ArrowRight className="ml-1.5 h-4 w-4 inline-block" aria-hidden />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {recentClientErrors.length === 0 ? (
                <EmptyState
                  title="No recent errors"
                  description="Client errors reported by the error boundary will appear here."
                  icon={<AlertCircle className="h-6 w-6" strokeWidth={1.5} />}
                  variant="no-results"
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                <ResponsiveTable>
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10 border-b border-border">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Path</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentClientErrors.map((err) => (
                        <TableRow
                          key={err.id}
                          className="border-b border-border/60 hover:bg-muted/50 transition-colors duration-150"
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground py-3 whitespace-nowrap">
                            {formatDate(err.created_at)}
                          </TableCell>
                          <TableCell className="py-3 text-sm text-foreground max-w-[280px] truncate" title={err.message}>
                            {err.message}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground font-mono truncate max-w-[160px]" title={err.path ?? ""}>
                            {err.path ?? "—"}
                          </TableCell>
                          <TableCell className="py-3 text-sm text-muted-foreground">
                            {err.user
                              ? `${err.user.first_name} ${err.user.last_name}`.trim() || err.user.email
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Table - Always visible in both modes */}
          <Card className="bg-card rounded-xl border border-border">
            <CardHeader className="px-6 pt-6 pb-4 border-b border-border/60">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
                  <CardDescription className="mt-1 text-sm text-muted-foreground">
                    Latest system events and changes from audit logs
                  </CardDescription>
                </div>
                <Link
                  href="/platform-admin/audit-logs"
                  className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors duration-150"
                >
                  View all audit logs
                  <ArrowRight className="ml-1.5 h-4 w-4 inline-block" aria-hidden />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              {recentActivity.length === 0 ? (
                <EmptyState
                  title="No recent activity"
                  description="Activity from users will appear here as they make changes to the system."
                  icon={<Activity className="h-6 w-6" strokeWidth={1.5} />}
                  variant="no-results"
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                <ResponsiveTable>
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10 border-b border-border">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entity</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Field</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Institution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentActivity.map((log) => (
                        <TableRow 
                          key={log.audit_id}
                          className="border-b border-border/60 hover:bg-muted/50 transition-colors duration-150"
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground py-3">
                            {formatDate(log.changed_at)}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm text-foreground truncate">
                                {log.changedBy?.first_name && log.changedBy?.last_name
                                  ? `${log.changedBy.first_name} ${log.changedBy.last_name}`
                                  : log.changedBy?.email || log.changed_by}
                              </span>
                              <span className="text-xs text-muted-foreground truncate mt-0.5">
                                {log.changedBy?.email || log.changed_by}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge 
                              variant={
                                log.change_type === "CREATE" ? "default" :
                                log.change_type === "DELETE" ? "destructive" :
                                "secondary"
                              }
                              className="text-xs px-2 py-0.5 h-5 font-medium"
                            >
                              {formatChangeType(log.change_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm text-foreground truncate">
                                {formatEntityType(log.entity_type)}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                                {log.entity_id.slice(0, 8)}...
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm text-foreground py-3 truncate">{formatFieldLabel(log.field_name)}</TableCell>
                          <TableCell className="py-3">
                            {log.institution ? (
                              <Link
                                href={`/platform-admin/institutions/${log.institution.institution_id}`}
                                className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors duration-150 truncate block"
                              >
                                {log.institution.trading_name || log.institution.legal_name}
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              )}
            </CardContent>
          </Card>
      </div>
  );
}

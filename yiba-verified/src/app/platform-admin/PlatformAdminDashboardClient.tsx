"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Building2, Users, ClipboardList, GraduationCap, Activity, Mail, Clock, FileText, CheckCircle2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { DashboardModeToggle } from "@/components/dashboard/DashboardModeToggle";
import { useDashboardMode } from "@/hooks/useDashboardMode";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SystemSnapshotCard } from "@/components/dashboard/SystemSnapshotCard";
import { SystemHealthCard } from "@/components/dashboard/SystemHealthCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";

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
  recentActivity: any[];
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
  recentActivity,
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

  return (
    <div className="space-y-6">
          {/* Dashboard Header Hero */}
          <div className="rounded-2xl border border-gray-200/60 bg-white px-6 py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Left: Greeting Section */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
                      {greeting}, {userName} 👋
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {todayDate}
                    </p>
                    <p className="text-sm text-gray-500">
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
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200/60">
                  Today
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200/60">
                  Platform Overview
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200/60">
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
                  delta={{
                    value: -3.5,
                    label: "-2 since yesterday",
                    trend: "down",
                  }}
                />
              </div>

              {/* Right: System Snapshot (1/3 width) */}
              <div className="lg:col-span-1">
                <SystemSnapshotCard className="h-full" />
              </div>
            </div>
          )}

          {/* ADVANCED MODE: Growth & Adoption KPIs, Engagement Analytics, Workflow Efficiency, System Health */}
          {mode === "advanced" && (
            <div className="space-y-6">
              {/* SECTION A: Growth & Adoption KPIs */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Growth & Adoption KPIs</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <MetricCard
                    title="Invites Sent (7 days)"
                    value={0}
                    icon={Mail}
                    subtitle="Coming soon"
                  />
                  <MetricCard
                    title="Invites Accepted"
                    value={0}
                    icon={CheckCircle2}
                    subtitle="Coming soon"
                  />
                  <MetricCard
                    title="Pending Invites"
                    value={0}
                    icon={Mail}
                    subtitle="Coming soon"
                  />
                  <MetricCard
                    title="Acceptance Rate %"
                    value={0}
                    icon={ArrowUpRight}
                    subtitle="Coming soon"
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Engagement Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ChartPlaceholder
                    title="Daily Active Users"
                    description="User activity over the past 7 days"
                    type="line"
                  />
                  <ChartPlaceholder
                    title="Weekly Active Institutions"
                    description="Institution engagement trends"
                    type="bar"
                  />
                </div>
              </div>

              {/* SECTION C: Workflow Efficiency + System Health */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Workflow Efficiency KPIs */}
                <div className="lg:col-span-3 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Workflow Efficiency</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                      title="Avg Review Time"
                      value={0}
                      icon={Clock}
                      subtitle="2.3 days (trend placeholder)"
                      delta={{
                        value: -0.5,
                        label: "-0.5 days",
                        trend: "up",
                      }}
                    />
                    <MetricCard
                      title="Submissions Today"
                      value={submissionsPending + submissionsUnderReview}
                      icon={FileText}
                      subtitle={`${submissionsTotal} total`}
                    />
                    <MetricCard
                      title="Overdue Submissions"
                      value={0}
                      icon={ClipboardList}
                      subtitle="> X days (placeholder)"
                    />
                    <MetricCard
                      title="Returned vs Approved"
                      value={0}
                      icon={CheckCircle2}
                      subtitle="Ratio (placeholder)"
                    />
                  </div>
                </div>

                {/* System Health Panel */}
                <div className="lg:col-span-1">
                  <SystemHealthCard />
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity Table - Always visible in both modes */}
          <Card className="bg-white rounded-xl border border-gray-200/60">
            <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100/60">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                  <CardDescription className="mt-1 text-sm text-gray-500">
                    Latest system events and changes from audit logs
                  </CardDescription>
                </div>
                <Link
                  href="/platform-admin/audit-logs"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-150"
                >
                  View all audit logs →
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
                    <TableHeader className="sticky top-0 bg-white z-10 border-b border-gray-200/60">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Field</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Institution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentActivity.map((log) => (
                        <TableRow 
                          key={log.audit_id}
                          className="border-b border-gray-100/60 hover:bg-gray-50/50 transition-colors duration-150"
                        >
                          <TableCell className="font-mono text-xs text-gray-600 py-3">
                            {formatDate(log.changed_at)}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-sm text-gray-900 truncate">
                                {log.changedBy?.first_name && log.changedBy?.last_name
                                  ? `${log.changedBy.first_name} ${log.changedBy.last_name}`
                                  : log.changedBy?.email || log.changed_by}
                              </span>
                              <span className="text-xs text-gray-500 truncate mt-0.5">
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
                              <span className="font-medium text-sm text-gray-900 truncate">
                                {formatEntityType(log.entity_type)}
                              </span>
                              <span className="text-xs text-gray-500 font-mono truncate mt-0.5">
                                {log.entity_id.slice(0, 8)}...
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm text-gray-900 py-3 truncate">{log.field_name || "—"}</TableCell>
                          <TableCell className="py-3">
                            {log.institution ? (
                              <Link
                                href={`/platform-admin/institutions/${log.institution.institution_id}`}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-150 truncate block"
                              >
                                {log.institution.trading_name || log.institution.legal_name}
                              </Link>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
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

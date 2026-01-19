"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ClipboardList,
  CheckCircle2,
  FileText,
  Inbox,
  FileCheck,
  ArrowRight,
  FileSearch,
} from "lucide-react";

interface QctoDashboardClientProps {
  userRole: "QCTO_USER" | "PLATFORM_ADMIN";
  submissionsTotal: number;
  submissionsSubmitted: number;
  submissionsUnderReview: number;
  submissionsApproved: number;
  submissionsRejected: number;
  requestsTotal: number;
  requestsPending: number;
  readinessSubmitted: number;
  readinessUnderReview: number;
  pendingSubmissions: any[];
  recentReviews: any[];
  pendingReadiness: any[];
}

/**
 * Client component for QCTO Dashboard
 */
export function QctoDashboardClient({
  userRole,
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
}: QctoDashboardClientProps) {
  const pendingReviewsCount = submissionsSubmitted + submissionsUnderReview;
  const pendingReadinessCount = readinessSubmitted + readinessUnderReview;

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Format relative time
  const formatRelativeTime = (date: Date | null) => {
    if (!date) return "—";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    return formatDate(date);
  };

  // Status pill with distinct colors (submissions + readiness)
  const getStatusBadge = (status: string) => {
    const label = status.replace(/_/g, " ");
    const base = "font-semibold";
    switch (status) {
      case "SUBMITTED":
        return <Badge className={`bg-blue-100 text-blue-800 ${base}`}>{label}</Badge>;
      case "UNDER_REVIEW":
        return <Badge className={`bg-purple-100 text-purple-800 ${base}`}>{label}</Badge>;
      case "APPROVED":
        return <Badge className={`bg-green-100 text-green-800 ${base}`}>{label}</Badge>;
      case "REJECTED":
        return <Badge className={`bg-red-100 text-red-800 ${base}`}>{label}</Badge>;
      case "RETURNED_FOR_CORRECTION":
        return <Badge className={`bg-orange-100 text-orange-800 ${base}`}>{label}</Badge>;
      case "PENDING":
        return <Badge className={`bg-amber-100 text-amber-800 ${base}`}>{label}</Badge>;
      default:
        return <Badge variant="outline" className={base}>{label}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">QCTO Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Oversight and review of institution readiness submissions
        </p>
      </div>

      {/* Metric Cards - Dot-grid + light blue. 5 in a row on large screens. */}
      <section className="qcto-metrics-pattern rounded-2xl border border-gray-200/70 bg-sky-50/60 px-6 py-6">
        <div className="relative z-10 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <DashboardMetricCard
            title="Pending Reviews"
            value={pendingReviewsCount}
            subtext={`${submissionsSubmitted} submitted, ${submissionsUnderReview} under review`}
            colorVariant="amber"
            trendTint="amber"
            icon={ClipboardList}
            trendPlaceholder="—"
          />
          <DashboardMetricCard
            title="Approved"
            value={submissionsApproved}
            subtext="Approved submissions"
            colorVariant="green"
            trendTint="green"
            icon={CheckCircle2}
            trendPlaceholder="—"
          />
          <DashboardMetricCard
            title="Total Submissions"
            value={submissionsTotal}
            subtext={`${submissionsRejected} rejected`}
            colorVariant="blue"
            trendTint="blue"
            icon={FileText}
            trendPlaceholder="—"
          />
          <DashboardMetricCard
            title="Pending Requests"
            value={requestsPending}
            subtext={`${requestsTotal} total requests`}
            colorVariant="purple"
            trendTint="blue"
            icon={Inbox}
            trendPlaceholder="—"
          />
          <DashboardMetricCard
            title="Pending Readiness"
            value={pendingReadinessCount}
            subtext="Readiness records awaiting review"
            colorVariant="cyan"
            trendTint="blue"
            icon={FileCheck}
            trendPlaceholder="—"
          />
        </div>
      </section>

      {/* Pending Reviews Table - Always visible in both modes */}
      <Card className="overflow-hidden border border-gray-200/60 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50/80 text-amber-700">
                <ClipboardList className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <CardTitle>Pending Reviews</CardTitle>
                <CardDescription>
                  {pendingReviewsCount === 0
                    ? "No submissions awaiting QCTO review"
                    : `About ${pendingReviewsCount} submission${pendingReviewsCount !== 1 ? "s" : ""} awaiting QCTO review`}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href="/qcto/submissions?status=SUBMITTED" className="gap-1.5">
                View all submissions
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingSubmissions.length === 0 ? (
            <EmptyState
              title="No pending reviews"
              description="Submissions awaiting review will appear here."
              icon={<ClipboardList className="h-8 w-8 text-gray-400" strokeWidth={1.5} />}
            />
          ) : (
            <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 [&_td]:border [&_td]:border-gray-200">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSubmissions.map((submission) => (
                  <TableRow key={submission.submission_id} className="hover:!bg-sky-50/90 transition-colors duration-200">
                    <TableCell className="font-medium">
                      {submission.title || `Submission ${submission.submission_id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell>
                      {submission.institution?.trading_name || submission.institution?.legal_name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {submission.submitted_at ? formatRelativeTime(submission.submitted_at) : "—"}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(submission.status)}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild className="rounded-full gap-1.5 transition-transform hover:scale-105">
                        <Link href={`/qcto/submissions/${submission.submission_id}`}>
                          <FileSearch className="h-3.5 w-3.5" aria-hidden />
                          Review
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Reviews - Always visible in both modes */}
      <Card className="overflow-hidden border border-gray-200/60 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50/80 text-emerald-700">
                <FileCheck className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>
                  {userRole === "QCTO_USER" ? "Your recent review actions" : "Recent review activity"}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href="/qcto/submissions?status=APPROVED" className="gap-1.5">
                View all reviewed submissions
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentReviews.length === 0 ? (
            <EmptyState
              title="No recent reviews"
              description="Your recent review actions will appear here."
              icon={<FileCheck className="h-8 w-8 text-gray-400" strokeWidth={1.5} />}
            />
          ) : (
            <div className="space-y-4">
              {recentReviews.map((submission) => (
                <div key={submission.submission_id} className="flex items-start gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="mr-2">{getStatusBadge(submission.status)}</span>
                      <Link
                        href={`/qcto/submissions/${submission.submission_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {submission.title || `Submission ${submission.submission_id.slice(0, 8)}`}
                      </Link>
                      {submission.institution && (
                        <span className="text-muted-foreground">
                          {" "}
                          — {submission.institution.trading_name || submission.institution.legal_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reviewed {submission.reviewed_at ? formatRelativeTime(submission.reviewed_at) : "—"}
                      {submission.submitted_at && (
                        <span> • Submitted {formatRelativeTime(submission.submitted_at)}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Readiness Reviews Table - Always visible in both modes */}
      {pendingReadinessCount > 0 && (
        <Card className="overflow-hidden border border-gray-200/60 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50/80 text-cyan-700">
                  <FileCheck className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <CardTitle>Pending Readiness Reviews</CardTitle>
                  <CardDescription>
                    About {pendingReadinessCount} readiness record{pendingReadinessCount !== 1 ? "s" : ""} awaiting QCTO review
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href="/qcto/readiness?status=SUBMITTED" className="gap-1.5">
                  View all readiness records
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingReadiness.length === 0 ? (
              <EmptyState
                title="No pending readiness reviews"
                description="Readiness records awaiting review will appear here."
                icon={<FileCheck className="h-8 w-8 text-gray-400" strokeWidth={1.5} />}
              />
            ) : (
              <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 [&_td]:border [&_td]:border-gray-200">
                <TableHeader>
                  <TableRow>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>SAQA ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReadiness.map((readiness) => (
                    <TableRow key={readiness.readiness_id} className="hover:!bg-sky-50/90 transition-colors duration-200">
                      <TableCell className="font-medium">
                        {readiness.qualification_title || "Untitled"}
                      </TableCell>
                      <TableCell>
                        {readiness.institution?.trading_name || readiness.institution?.legal_name || "—"}
                      </TableCell>
                      <TableCell>{readiness.saqa_id || "N/A"}</TableCell>
                      <TableCell>
                        {getStatusBadge(readiness.readiness_status)}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild className="rounded-full gap-1.5 transition-transform hover:scale-105">
                          <Link href={`/qcto/readiness/${readiness.readiness_id}`}>
                            <FileSearch className="h-3.5 w-3.5" aria-hidden />
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
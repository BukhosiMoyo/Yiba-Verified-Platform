"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/shared/ExportButton";
import {
  FileText,
  BarChart3,
  ClipboardCheck,
  Users,
  GraduationCap,
  ExternalLink,
  Flag,
  FileCheck,
} from "lucide-react";

const iconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";

export default function ReportsPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          Generate and export platform-wide reports and analytics to CSV or JSON
        </p>
      </div>

      {/* Institution & activity data */}
      <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className={iconWrap}>
              <FileText className="h-5 w-5" />
            </span>
            Institution Reports
          </CardTitle>
          <CardDescription>
            Export learners, enrolments, submissions, and readiness (Form 5) across all institutions
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2 rounded-lg border border-gray-200/60 dark:border-gray-800/60 p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">Learners</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700">
                <Link href="/platform-admin/learners" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </Link>
              </Button>
              <ExportButton exportUrl="/api/export/learners" format="csv" label="Learners" className="justify-center" />
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-gray-200/60 dark:border-gray-800/60 p-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">Enrolments</span>
            </div>
            <ExportButton exportUrl="/api/export/enrolments" format="csv" label="Enrolments" className="w-full justify-center" />
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-gray-200/60 dark:border-gray-800/60 p-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">Submissions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700">
                <Link href="/platform-admin/institutions" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Institutions
                </Link>
              </Button>
              <ExportButton exportUrl="/api/export/submissions" format="csv" label="Submissions" className="justify-center" />
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-gray-200/60 dark:border-gray-800/60 p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">Readiness (Form 5)</span>
            </div>
            <ExportButton exportUrl="/api/export/readiness" format="csv" label="Readiness" className="w-full justify-center" />
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className={iconWrap}>
              <BarChart3 className="h-5 w-5" />
            </span>
            Analytics Dashboard
          </CardTitle>
          <CardDescription>
            View platform-wide metrics and invite analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700">
            <Link href="/platform-admin" className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              Platform dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700">
            <Link href="/platform-admin/invites/analytics" className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              Invite analytics
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Compliance & audit */}
      <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className={iconWrap}>
              <FileCheck className="h-5 w-5" />
            </span>
            Compliance & Audit Reports
          </CardTitle>
          <CardDescription>
            Export audit logs, evidence flags, and QCTO requests for compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-lg border border-gray-200/60 dark:border-gray-800/60 p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">Audit logs</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700">
                <Link href="/platform-admin/audit-logs" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </Link>
              </Button>
              <ExportButton exportUrl="/api/export/audit-logs" format="csv" label="Audit logs" className="justify-center" />
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-gray-200/60 dark:border-gray-800/60 p-3">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">Evidence flags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700">
                <Link href="/qcto/evidence-flags" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </Link>
              </Button>
              <ExportButton exportUrl="/api/export/evidence-flags" format="csv" label="Evidence flags" className="justify-center" />
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-gray-200/60 dark:border-gray-800/60 p-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">QCTO requests</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700">
                <Link href="/qcto/requests" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </Link>
              </Button>
              <ExportButton exportUrl="/api/export/qcto-requests" format="csv" label="QCTO requests" className="justify-center" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

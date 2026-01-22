"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/shared/ExportButton";
import { ClipboardCheck, FileText, Flag, BarChart3, ExternalLink } from "lucide-react";

const iconWrap = "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";

export default function QCTOReportsPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          Generate and export QCTO reports and analytics to CSV or JSON
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className={iconWrap}>
                <ClipboardCheck className="h-5 w-5" />
              </span>
              Submissions & Readiness
            </CardTitle>
            <CardDescription>
              Export submissions and Form 5 readiness reviews for compliance reporting
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <Link href="/qcto/submissions" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View submissions
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <Link href="/qcto/readiness" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View readiness
                </Link>
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <ExportButton exportUrl="/api/export/submissions" format="csv" label="Submissions" className="w-full justify-center" />
              <ExportButton exportUrl="/api/export/readiness" format="csv" label="Readiness" className="w-full justify-center" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className={iconWrap}>
                <FileText className="h-5 w-5" />
              </span>
              QCTO Requests
            </CardTitle>
            <CardDescription>
              Export and analyse institution access requests (status, reviewers, dates)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Link href="/qcto/requests" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                View requests
              </Link>
            </Button>
            <ExportButton exportUrl="/api/export/qcto-requests" format="csv" />
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className={iconWrap}>
                <Flag className="h-5 w-5" />
              </span>
              Evidence & Compliance
            </CardTitle>
            <CardDescription>
              Export evidence flags and document compliance status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Link href="/qcto/evidence-flags" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                View evidence flags
              </Link>
            </Button>
            <ExportButton exportUrl="/api/export/evidence-flags" format="csv" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className={iconWrap}>
              <BarChart3 className="h-5 w-5" />
            </span>
            Audit Logs
          </CardTitle>
          <CardDescription>
            View the full audit trail and export change history with filters
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <Link href="/qcto/audit-logs" className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              View audit logs
            </Link>
          </Button>
          <ExportButton exportUrl="/api/export/audit-logs" format="csv" />
        </CardContent>
      </Card>
    </div>
  );
}

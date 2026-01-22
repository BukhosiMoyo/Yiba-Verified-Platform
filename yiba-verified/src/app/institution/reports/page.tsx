"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/shared/ExportButton";
import { ClipboardCheck, FileText, Users, GraduationCap, ExternalLink } from "lucide-react";

const iconWrap = "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";

export default function InstitutionReportsPage() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          Export your institution&apos;s data to CSV or JSON for compliance and reporting
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className={iconWrap}>
                <ClipboardCheck className="h-5 w-5" />
              </span>
              Submissions
            </CardTitle>
            <CardDescription>
              Export compliance packs and submissions for QCTO
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline" size="sm" className="w-full justify-center border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Link href="/institution/submissions" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                View submissions
              </Link>
            </Button>
            <ExportButton exportUrl="/api/export/submissions" format="csv" label="Submissions" className="w-full justify-center" />
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className={iconWrap}>
                <FileText className="h-5 w-5" />
              </span>
              Readiness (Form 5)
            </CardTitle>
            <CardDescription>
              Export Form 5 readiness records and reviews
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline" size="sm" className="w-full justify-center border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Link href="/institution/readiness" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                View readiness
              </Link>
            </Button>
            <ExportButton exportUrl="/api/export/readiness" format="csv" label="Readiness" className="w-full justify-center" />
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className={iconWrap}>
                <GraduationCap className="h-5 w-5" />
              </span>
              Enrolments
            </CardTitle>
            <CardDescription>
              Export learner enrolments by qualification and status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline" size="sm" className="w-full justify-center border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Link href="/institution/enrolments" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                View enrolments
              </Link>
            </Button>
            <ExportButton exportUrl="/api/export/enrolments" format="csv" label="Enrolments" className="w-full justify-center" />
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className={iconWrap}>
                <Users className="h-5 w-5" />
              </span>
              Learners
            </CardTitle>
            <CardDescription>
              Export learner records and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline" size="sm" className="w-full justify-center border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <Link href="/institution/learners" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                View learners
              </Link>
            </Button>
            <ExportButton exportUrl="/api/export/learners" format="csv" label="Learners" className="w-full justify-center" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

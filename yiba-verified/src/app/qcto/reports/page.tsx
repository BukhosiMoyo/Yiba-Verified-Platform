"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/shared/ExportButton";
import { ClipboardCheck, FileText, Flag, FileBarChart, ExternalLink } from "lucide-react";

export default function QCTOReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-2">
          Generate and export QCTO reports and analytics to CSV or JSON
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-gray-500" />
              Submissions & Readiness
            </CardTitle>
            <CardDescription>
              Export submissions and Form 5 readiness reviews for compliance reporting
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <ExportButton
              exportUrl="/api/export/submissions"
              format="csv"
              className="w-full"
            />
            <ExportButton
              exportUrl="/api/export/readiness"
              format="csv"
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              QCTO Requests
            </CardTitle>
            <CardDescription>
              Export and analyse institution access requests (status, reviewers, dates)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButton
              exportUrl="/api/export/qcto-requests"
              format="csv"
              className="w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-gray-500" />
              Evidence & Compliance
            </CardTitle>
            <CardDescription>
              Export evidence flags and document compliance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButton
              exportUrl="/api/export/evidence-flags"
              format="csv"
              className="w-full"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-gray-500" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            View the full audit trail and export change history with filters
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/qcto/audit-logs" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View audit logs
            </Link>
          </Button>
          <ExportButton
            exportUrl="/api/export/audit-logs"
            format="csv"
          />
        </CardContent>
      </Card>
    </div>
  );
}

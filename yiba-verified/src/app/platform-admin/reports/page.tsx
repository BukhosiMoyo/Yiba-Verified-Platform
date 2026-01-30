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
  Download,
  TrendingUp,
  Building2,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportItemProps {
  icon: React.ReactNode;
  title: string;
  viewHref?: string;
  viewLabel?: string;
  exportUrl: string;
}

function ReportItem({ icon, title, viewHref, viewLabel = "View", exportUrl }: ReportItemProps) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="font-medium text-foreground text-sm truncate">{title}</span>
      </div>
      <div className="flex flex-col gap-2">
        {viewHref && (
          <Button asChild variant="outline" size="sm" className="w-full justify-center">
            <Link href={viewHref} className="gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              {viewLabel}
            </Link>
          </Button>
        )}
        <ExportButton 
          exportUrl={exportUrl} 
          format="csv" 
          className="w-full justify-center"
        />
      </div>
    </div>
  );
}

interface SectionCardProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SectionCard({ icon, iconColor, title, description, children }: SectionCardProps) {
  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            iconColor
          )}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reports</h1>
          </div>
        </div>
        <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-2xl">
          Generate and export platform-wide reports and analytics. Download data in CSV format for analysis or compliance purposes.
        </p>
      </div>

      {/* Stats Overview - Optional visual element */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Learners</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Export</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Enrolments</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Export</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ScrollText className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Audit Logs</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Export</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileCheck className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Readiness</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Export</span>
        </div>
      </div>

      {/* Institution Reports */}
      <SectionCard
        icon={<Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        iconColor="bg-blue-100 dark:bg-blue-500/20"
        title="Institution Reports"
        description="Export learners, enrolments, submissions, and readiness (Form 5) across all institutions"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReportItem
            icon={<Users className="h-4 w-4" />}
            title="Learners"
            viewHref="/platform-admin/learners"
            exportUrl="/api/export/learners"
          />
          <ReportItem
            icon={<GraduationCap className="h-4 w-4" />}
            title="Enrolments"
            exportUrl="/api/export/enrolments"
          />
          <ReportItem
            icon={<ClipboardCheck className="h-4 w-4" />}
            title="Submissions"
            viewHref="/platform-admin/institutions"
            viewLabel="Institutions"
            exportUrl="/api/export/submissions"
          />
          <ReportItem
            icon={<FileText className="h-4 w-4" />}
            title="Readiness (Form 5)"
            exportUrl="/api/export/readiness"
          />
        </div>
      </SectionCard>

      {/* Analytics Dashboard */}
      <SectionCard
        icon={<TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
        iconColor="bg-emerald-100 dark:bg-emerald-500/20"
        title="Analytics Dashboard"
        description="View platform-wide metrics and invite analytics"
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="default">
            <Link href="/platform-admin" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Platform Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="default">
            <Link href="/platform-admin/invites/analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Invite Analytics
            </Link>
          </Button>
        </div>
      </SectionCard>

      {/* Compliance & Audit Reports */}
      <SectionCard
        icon={<FileCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
        iconColor="bg-amber-100 dark:bg-amber-500/20"
        title="Compliance & Audit Reports"
        description="Export audit logs, evidence flags, and QCTO requests for compliance"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReportItem
            icon={<ScrollText className="h-4 w-4" />}
            title="Audit Logs"
            viewHref="/platform-admin/audit-logs"
            exportUrl="/api/export/audit-logs"
          />
          <ReportItem
            icon={<Flag className="h-4 w-4" />}
            title="Evidence Flags"
            viewHref="/qcto/evidence-flags"
            exportUrl="/api/export/evidence-flags"
          />
          <ReportItem
            icon={<ClipboardCheck className="h-4 w-4" />}
            title="QCTO Requests"
            viewHref="/qcto/requests"
            exportUrl="/api/export/qcto-requests"
          />
        </div>
      </SectionCard>
    </div>
  );
}

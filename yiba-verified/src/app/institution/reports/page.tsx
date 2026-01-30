"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/shared/ExportButton";
import { ClipboardCheck, FileText, Users, GraduationCap, ExternalLink, Download } from "lucide-react";

const REPORT_SECTIONS = [
  {
    title: "Submissions",
    description: "Export compliance packs and submissions for QCTO",
    icon: ClipboardCheck,
    viewHref: "/institution/submissions",
    exportUrl: "/api/export/submissions",
    exportLabel: "Submissions",
  },
  {
    title: "Readiness (Form 5)",
    description: "Export Form 5 readiness records and reviews",
    icon: FileText,
    viewHref: "/institution/readiness",
    exportUrl: "/api/export/readiness",
    exportLabel: "Readiness",
  },
  {
    title: "Enrolments",
    description: "Export learner enrolments by qualification and status",
    icon: GraduationCap,
    viewHref: "/institution/enrolments",
    exportUrl: "/api/export/enrolments",
    exportLabel: "Enrolments",
  },
  {
    title: "Learners",
    description: "Export learner records and contact details",
    icon: Users,
    viewHref: "/institution/learners",
    exportUrl: "/api/export/learners",
    exportLabel: "Learners",
  },
];

export default function InstitutionReportsPage() {
  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Export your institution&apos;s data to CSV or JSON for compliance and reporting
        </p>
      </div>

      {/* Reports Grid - 2 per row */}
      <div className="grid gap-6 md:grid-cols-2">
        {REPORT_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Card 
              key={section.title} 
              className="border-border bg-card overflow-hidden"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={section.viewHref} className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View {section.title.split(" ")[0]}
                    </Link>
                  </Button>
                  <ExportButton 
                    exportUrl={section.exportUrl} 
                    format="csv" 
                    label={section.exportLabel} 
                    className="flex-1" 
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

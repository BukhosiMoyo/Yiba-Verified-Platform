"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hash,
  BookMarked,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  FileText,
} from "lucide-react";

export type InstitutionQualificationSafe = {
  id?: string;
  name: string;
  status: string;
  saqa_id: string | null;
  curriculum_code: string | null;
  nqf_level: number | null;
  credits: number | null;
  occupational_category: string | null;
  description: string | null;
  updated_at: string;
};

function formatStatus(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Active", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
    INACTIVE: { label: "Inactive", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
    RETIRED: { label: "Retired", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
    DRAFT: { label: "Draft", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  };
  return map[status] || { label: status, className: "bg-muted text-muted-foreground" };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface QualificationOverviewInstitutionProps {
  qualification: InstitutionQualificationSafe;
  compact?: boolean;
}

export function QualificationOverviewInstitution({
  qualification,
  compact = false,
}: QualificationOverviewInstitutionProps) {
  const statusBadge = formatStatus(qualification.status);

  if (compact) {
    const rowClass = "flex items-start gap-3 py-2.5 text-sm";
    const iconClass = "h-4 w-4 shrink-0 text-muted-foreground mt-0.5";
    const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0 min-w-[7rem]";
    const valueClass = "text-foreground min-w-0";

    const DetailRow = ({
      icon: Icon,
      label,
      value,
      mono = false,
    }: {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      value: React.ReactNode;
      mono?: boolean;
    }) => (
      <div className={rowClass}>
        <Icon className={iconClass} aria-hidden />
        <span className={labelClass}>{label}</span>
        <span className={`${valueClass} ${mono ? "font-mono" : ""}`}>{value}</span>
      </div>
    );

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">{qualification.name}</h3>
          <Badge className={`mt-1 ${statusBadge.className}`}>{statusBadge.label}</Badge>
        </div>

        <div className="space-y-3">
          <div className="space-y-0">
            {qualification.saqa_id != null && qualification.saqa_id !== "" && (
              <DetailRow icon={Hash} label="SAQA ID" value={qualification.saqa_id} mono />
            )}
            {qualification.curriculum_code != null && qualification.curriculum_code !== "" && (
              <DetailRow icon={BookMarked} label="Curriculum code" value={qualification.curriculum_code} mono />
            )}
            {qualification.nqf_level != null && (
              <DetailRow icon={Award} label="NQF level" value={`NQF ${qualification.nqf_level}`} />
            )}
            {qualification.credits != null && (
              <DetailRow icon={BookOpen} label="Credits" value={String(qualification.credits)} />
            )}
          </div>

          <div className="border-t border-border pt-4 space-y-0">
            {qualification.occupational_category != null && qualification.occupational_category !== "" && (
              <DetailRow icon={Briefcase} label="Occupational category" value={qualification.occupational_category} />
            )}
            <DetailRow icon={Calendar} label="Last updated" value={formatDate(qualification.updated_at)} />
            {qualification.description != null && qualification.description !== "" && (
              <div className={rowClass}>
                <FileText className={iconClass} aria-hidden />
                <span className={labelClass}>Description</span>
                <p className={`${valueClass} whitespace-pre-wrap`}>{qualification.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{qualification.name}</h2>
        <Badge className={`mt-2 ${statusBadge.className}`}>{statusBadge.label}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          <CardDescription>SAQA, curriculum, NQF and credits</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SAQA ID</span>
            <p className="font-mono mt-0.5">{qualification.saqa_id ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Curriculum code</span>
            <p className="font-mono mt-0.5">{qualification.curriculum_code ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">NQF level</span>
            <p className="mt-0.5">{qualification.nqf_level != null ? `NQF ${qualification.nqf_level}` : "—"}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</span>
            <p className="mt-0.5">{qualification.credits ?? "—"}</p>
          </div>
          <div className="md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Occupational category</span>
            <p className="mt-0.5">{qualification.occupational_category ?? "—"}</p>
          </div>
          <div className="md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last updated</span>
            <p className="mt-0.5">{formatDate(qualification.updated_at)}</p>
          </div>
        </CardContent>
      </Card>

      {qualification.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{qualification.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

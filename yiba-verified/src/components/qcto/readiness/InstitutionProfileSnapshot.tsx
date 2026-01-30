"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Calendar, CheckCircle2, XCircle, GraduationCap, Loader2, AlertCircle } from "lucide-react";

interface InstitutionProfileSnapshotProps {
  institutionId: string;
}

interface InstitutionStats {
  institution: {
    institution_id: string;
    name: string;
    legal_name: string;
    trading_name: string | null;
    status: string;
  };
  years_active: number;
  previous_submissions_count: number;
  approved_count: number;
  rejected_count: number;
  approved_qualifications: Array<{
    readiness_id: string;
    qualification_title: string;
    saqa_id: string;
    nqf_level: number | null;
  }>;
}

/**
 * Institution Profile Snapshot Component
 * 
 * Displays compact read-only profile panel showing:
 * - Institution name
 * - Accreditation status
 * - Years active
 * - Previous submissions count
 * - Approved vs rejected history
 * - Existing approved qualifications
 */
export function InstitutionProfileSnapshot({ institutionId }: InstitutionProfileSnapshotProps) {
  const [stats, setStats] = useState<InstitutionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await fetch(`/api/qcto/institutions/${institutionId}/readiness-stats`);
        if (!response.ok) {
          throw new Error("Failed to fetch institution stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to load institution stats");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [institutionId]);

  if (loading) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50/60 to-white dark:from-blue-950/30 dark:to-transparent border-b">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="bg-gradient-to-r from-red-50/60 to-white dark:from-red-950/30 dark:to-transparent border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Institution Profile</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Error loading profile</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-900 dark:text-red-300">
              {error || "Unable to load institution profile. Please try refreshing the page."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
      APPROVED: { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
      SUSPENDED: { label: "Suspended", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
    };
    return statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" };
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="bg-gradient-to-r from-blue-50/60 to-white dark:from-blue-950/30 dark:to-transparent border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Institution Profile</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Institution history and performance</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Institution Name</span>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.institution.name}</p>
            <Badge className={`mt-1 ${getStatusBadge(stats.institution.status).className}`}>
              {getStatusBadge(stats.institution.status).label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Years Active</span>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                {stats.years_active}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Previous Submissions</span>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.previous_submissions_count}</p>
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approval History</span>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{stats.approved_count} Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{stats.rejected_count} Rejected</span>
              </div>
            </div>
          </div>

          {stats.approved_qualifications.length > 0 && (
            <div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Approved Qualifications ({stats.approved_qualifications.length})
              </span>
              <div className="mt-2 space-y-2">
                {stats.approved_qualifications.slice(0, 3).map((qual) => (
                  <div key={qual.readiness_id} className="flex items-start gap-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 p-2">
                    <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{qual.qualification_title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {qual.saqa_id} {qual.nqf_level ? `• NQF ${qual.nqf_level}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
                {stats.approved_qualifications.length > 3 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    +{stats.approved_qualifications.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

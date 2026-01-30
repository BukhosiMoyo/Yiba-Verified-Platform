"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2 } from "lucide-react";

interface SystemSnapshotCardProps {
  className?: string;
  /** Average review turnaround in days (submission submitted_at → reviewed_at). Omit or null = "No data yet". */
  avgReviewTimeDays?: number | null;
}

function formatReviewTime(days: number): string {
  if (days === 0) return "0 days";
  if (days < 1) return `${Math.round(days * 24 * 10) / 10} hours`;
  return `${Math.round(days * 10) / 10} days`;
}

/**
 * SystemSnapshotCard Component
 *
 * Compact system status snapshot for Lite mode.
 * Avg Review Turnaround uses real data when avgReviewTimeDays is provided.
 */
export function SystemSnapshotCard({ className, avgReviewTimeDays }: SystemSnapshotCardProps) {
  const hasTurnaroundData =
    typeof avgReviewTimeDays === "number" && Number.isFinite(avgReviewTimeDays) && avgReviewTimeDays >= 0;

  return (
    <Card className={`group relative flex flex-col h-full border border-border rounded-xl transition-all duration-200 hover:border-border/80 overflow-hidden bg-gradient-to-br from-emerald-50/60 via-card to-card dark:from-emerald-950/30 dark:via-card dark:to-card ${className || ""}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pt-5 pb-3 flex-shrink-0">
        <CardTitle className="text-sm font-medium text-muted-foreground min-w-0 flex-1 pr-2">
          <span className="truncate block">System Snapshot</span>
        </CardTitle>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 transition-colors duration-200 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50">
          <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 flex flex-col justify-between flex-1 min-h-0 space-y-4">
        {/* System Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={2} />
            <span className="text-sm font-medium text-foreground">System Status</span>
          </div>
          <div className="flex items-center gap-2 ml-6">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Operational</span>
          </div>
        </div>

        {/* Avg Review Turnaround — real data or "No data yet" */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground block">Avg Review Turnaround</span>
          {hasTurnaroundData ? (
            <span className="text-lg font-semibold text-foreground">{formatReviewTime(avgReviewTimeDays)}</span>
          ) : (
            <span className="text-sm text-muted-foreground">No data yet</span>
          )}
        </div>

        {/* Alerts */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <span className="text-xs font-medium text-muted-foreground block">Alerts</span>
          <span className="text-xs text-muted-foreground">No active alerts</span>
        </div>
      </CardContent>
    </Card>
  );
}

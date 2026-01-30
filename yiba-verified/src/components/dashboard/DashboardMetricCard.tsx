"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardMetricColorVariant = "blue" | "green" | "amber" | "purple" | "cyan";
export type DashboardMetricTrendTint = "green" | "amber" | "blue";

/** Card background with subtle gradient - dark mode aware */
const cardStyleByVariant: Record<DashboardMetricColorVariant, string> = {
  amber: "bg-card border-amber-200/50 dark:border-amber-500/20",
  green: "bg-card border-emerald-200/50 dark:border-emerald-500/20",
  blue: "bg-card border-blue-200/50 dark:border-blue-500/20",
  purple: "bg-card border-indigo-200/50 dark:border-indigo-500/20",
  cyan: "bg-card border-cyan-200/50 dark:border-cyan-500/20",
};

/** Icon chip: rounded-xl p-2.5, tinted bg - dark mode aware */
const iconChipByVariant: Record<DashboardMetricColorVariant, string> = {
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  purple: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400",
};

/** Trend chip - dark mode aware */
const trendChipByTint: Record<DashboardMetricTrendTint, string> = {
  green: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
  amber: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  blue: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
};

export interface DashboardMetricCardProps {
  title: string;
  value: number | string;
  subtext: string;
  colorVariant: DashboardMetricColorVariant;
  trendTint?: DashboardMetricTrendTint;
  icon: LucideIcon;
  /** Placeholder until trend data exists. Default "—" */
  trendPlaceholder?: string;
  className?: string;
  /** Slightly smaller card for Advanced denser layout */
  compact?: boolean;
}

/**
 * Metric card for QCTO dashboard. Solid surface, subtle colored border, icon chip.
 */
export function DashboardMetricCard({
  title,
  value,
  subtext,
  colorVariant,
  trendTint,
  icon: Icon,
  trendPlaceholder = "—",
  className,
  compact = false,
}: DashboardMetricCardProps) {
  const tint: DashboardMetricTrendTint =
    trendTint ?? (colorVariant === "green" ? "green" : colorVariant === "amber" ? "amber" : "blue");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border shadow-sm dark:shadow-none",
        cardStyleByVariant[colorVariant],
        compact ? "p-4" : "p-5",
        "flex flex-col gap-3",
        className
      )}
    >
      <div className={cn("flex items-start justify-between gap-3", compact ? "gap-2" : "")}>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl p-2.5",
            iconChipByVariant[colorVariant]
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
      <div className={cn("flex flex-wrap items-end justify-between gap-2", compact ? "gap-1.5" : "gap-2")}>
        <div>
          <div
            className={cn(
              "font-semibold text-foreground",
              compact ? "text-2xl" : "text-3xl"
            )}
          >
            {value}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
            trendChipByTint[tint]
          )}
        >
          {trendPlaceholder}
        </span>
      </div>
    </div>
  );
}

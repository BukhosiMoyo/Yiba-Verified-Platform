"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardMetricColorVariant = "blue" | "green" | "amber" | "purple" | "cyan";
export type DashboardMetricTrendTint = "green" | "amber" | "blue";

/** Faint top gradient + light blue wash at bottom. */
const gradientByVariant: Record<DashboardMetricColorVariant, string> = {
  amber: "bg-gradient-to-b from-amber-50/40 to-sky-50/30",
  green: "bg-gradient-to-b from-emerald-50/40 to-sky-50/30",
  blue: "bg-gradient-to-b from-blue-50/40 to-sky-50/30",
  purple: "bg-gradient-to-b from-indigo-50/40 to-sky-50/30",
  cyan: "bg-gradient-to-b from-cyan-50/40 to-sky-50/30",
};

/** Icon chip: rounded-xl p-2.5, tinted bg. */
const iconChipByVariant: Record<DashboardMetricColorVariant, string> = {
  amber: "bg-amber-50 text-amber-700",
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  purple: "bg-indigo-50 text-indigo-700",
  cyan: "bg-cyan-50 text-cyan-700",
};

/** Trend chip. */
const trendChipByTint: Record<DashboardMetricTrendTint, string> = {
  green: "bg-emerald-50/90 text-emerald-600 border-emerald-200/60",
  amber: "bg-amber-50/90 text-amber-600 border-amber-200/60",
  blue: "bg-blue-50/90 text-blue-600 border-blue-200/60",
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
 * Metric card for QCTO dashboard. Solid surface, gradient tint, light blue wash, icon chip.
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
        "overflow-hidden rounded-xl border border-gray-200/70 shadow-sm",
        gradientByVariant[colorVariant],
        compact ? "p-4" : "p-5",
        "flex flex-col gap-3",
        className
      )}
    >
      <div className={cn("flex items-start justify-between gap-3", compact ? "gap-2" : "")}>
        <span className="text-sm font-medium text-gray-600">{title}</span>
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
              "font-semibold text-gray-900",
              compact ? "text-2xl" : "text-3xl"
            )}
          >
            {value}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>
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

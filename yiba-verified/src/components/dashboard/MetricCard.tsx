"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

const ACCENT_GRADIENTS: Record<string, { card: string; icon: string; iconBg: string }> = {
  blue: {
    card: "bg-gradient-to-br from-blue-50/60 via-white to-white",
    icon: "text-blue-600",
    iconBg: "bg-blue-50 group-hover:bg-blue-100",
  },
  indigo: {
    card: "bg-gradient-to-br from-indigo-50/60 via-white to-white",
    icon: "text-indigo-600",
    iconBg: "bg-indigo-50 group-hover:bg-indigo-100",
  },
  amber: {
    card: "bg-gradient-to-br from-amber-50/60 via-white to-white",
    icon: "text-amber-600",
    iconBg: "bg-amber-50 group-hover:bg-amber-100",
  },
  purple: {
    card: "bg-gradient-to-br from-purple-50/60 via-white to-white",
    icon: "text-purple-600",
    iconBg: "bg-purple-50 group-hover:bg-purple-100",
  },
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  delta?: {
    value: number;
    label: string;
    trend?: "up" | "down";
  };
  subtitle?: string;
  className?: string;
  /** Accent for a subtle gradient and icon tint (blue, indigo, amber, purple). */
  accent?: keyof typeof ACCENT_GRADIENTS;
}

/**
 * MetricCard Component
 * 
 * Consistent metric card with icon, value, label, and optional delta/subtitle
 */
export function MetricCard({
  title,
  value,
  icon: Icon,
  delta,
  subtitle,
  className,
  accent,
}: MetricCardProps) {
  const styles = accent ? ACCENT_GRADIENTS[accent] : null;

  return (
    <Card
      className={`group relative flex flex-col h-full border border-gray-200/80 rounded-xl transition-all duration-200 hover:border-gray-300 overflow-hidden ${
        styles ? styles.card : "bg-white hover:bg-gray-50/50"
      } ${className || ""}`}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pt-5 pb-3 flex-shrink-0">
        <CardTitle className="text-sm font-medium text-gray-600 min-w-0 flex-1 pr-2">
          <span className="truncate block">{title}</span>
        </CardTitle>
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
            styles ? styles.iconBg : "bg-blue-50 group-hover:bg-blue-100"
          }`}
        >
          <Icon
            className={`h-5 w-5 ${styles ? styles.icon : "text-blue-600"}`}
            strokeWidth={1.5}
          />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 flex flex-col justify-between flex-1 min-h-0">
        <div className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">
          <AnimatedCounter value={value} />
        </div>
        <div className="flex items-center justify-between gap-2 mt-auto">
          {subtitle && (
            <p className="text-xs text-gray-500 truncate min-w-0 flex-1">
              {subtitle}
            </p>
          )}
          {delta && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0 border ${
              delta.trend === "down"
                ? "bg-red-50 text-red-700 border-red-100"
                : "bg-green-50 text-green-700 border-green-100"
            }`}>
              {delta.trend === "down" ? (
                <TrendingDown className="h-3 w-3" strokeWidth={2} />
              ) : (
                <TrendingUp className="h-3 w-3" strokeWidth={2} />
              )}
              <span className="text-xs font-medium">{delta.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

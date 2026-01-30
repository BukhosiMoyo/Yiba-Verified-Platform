"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";

interface ChartPlaceholderProps {
  title: string;
  description?: string;
  type?: "line" | "bar";
  className?: string;
  /** Real data: one value per bar (length 7 for last 7 days). When provided, labels and bar heights are driven by data. */
  data?: number[];
  /** X-axis labels (e.g. Mon, Tue, …). Required when data is provided. */
  labels?: string[];
}

/**
 * ChartPlaceholder Component
 * 
 * Premium-looking skeleton chart placeholder for analytics sections
 */
export function ChartPlaceholder({
  title,
  description,
  type = "line",
  className,
  data,
  labels,
}: ChartPlaceholderProps) {
  const Icon = type === "bar" ? BarChart3 : TrendingUp;
  const hasData = Array.isArray(data) && data.length > 0;
  const xLabels = (hasData && labels && labels.length === data.length ? labels : null) ?? [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];
  const values = hasData ? data : [...Array(7)].map(() => 30 + Math.random() * 50);
  const max = Math.max(...values, 1);
  const heights = values.map((v) => (v / max) * 100);

  return (
    <Card className={`border border-border bg-card rounded-xl ${className || ""}`}>
      <CardHeader className="px-6 pt-6 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        </div>
        {description && (
          <CardDescription className="mt-1 text-sm text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-6">
        <div className="relative h-[280px] w-full">
          {/* Chart area with grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="border-b border-border/60"
                style={{ height: `${100 / 5}%` }}
              />
            ))}
          </div>

          {/* Chart bars/lines: stronger color when real data */}
          <div className="absolute inset-0 flex items-end justify-around gap-2 px-4 pb-8">
            {heights.slice(0, 7).map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t transition-all duration-300 hover:opacity-90 ${
                  type === "bar"
                    ? hasData
                      ? "bg-gradient-to-t from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-500"
                      : "bg-gradient-to-t from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-950/30"
                    : hasData
                      ? "bg-gradient-to-t from-transparent via-blue-500/60 to-transparent"
                      : "bg-gradient-to-t from-transparent via-blue-100/50 to-transparent dark:via-blue-800/30"
                }`}
                style={{ height: `${Math.max(h, 2)}%` }}
                title={hasData ? `${xLabels[i]}: ${values[i]}` : undefined}
              />
            ))}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-around px-4 pb-2">
            {xLabels.slice(0, 7).map((day, i) => (
              <span key={i} className="text-xs text-muted-foreground font-medium">
                {day}
              </span>
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card/20 pointer-events-none rounded-b-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

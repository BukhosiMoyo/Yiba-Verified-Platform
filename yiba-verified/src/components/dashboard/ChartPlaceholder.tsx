"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";

interface ChartPlaceholderProps {
  title: string;
  description?: string;
  type?: "line" | "bar";
  className?: string;
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
}: ChartPlaceholderProps) {
  const Icon = type === "bar" ? BarChart3 : TrendingUp;

  return (
    <Card className={`border border-gray-200/60 bg-white rounded-xl ${className || ""}`}>
      <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100/60">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
        </div>
        {description && (
          <CardDescription className="mt-1 text-sm text-gray-500">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-6">
        <div className="relative h-[280px] w-full">
          {/* Chart area with grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {/* Grid lines */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="border-b border-gray-100/60"
                style={{ height: `${100 / 5}%` }}
              />
            ))}
          </div>

          {/* Chart bars/lines */}
          <div className="absolute inset-0 flex items-end justify-around gap-2 px-4 pb-8">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`flex-1 bg-gradient-to-t ${
                  type === "bar"
                    ? "from-blue-100 to-blue-50 rounded-t"
                    : "from-transparent via-blue-100/50 to-transparent"
                } transition-all duration-300 hover:opacity-80`}
                style={{
                  height: `${30 + Math.random() * 50}%`,
                }}
              />
            ))}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-around px-4 pb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <span key={i} className="text-xs text-gray-400 font-medium">
                {day}
              </span>
            ))}
          </div>

          {/* Overlay for premium effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20 pointer-events-none rounded-b-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { DashboardMode } from "@/hooks/useDashboardMode";

interface DashboardModeToggleProps {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
}

/**
 * Segmented control for Lite and Advanced dashboard modes.
 * Advanced active: dark pill. Lite stays light.
 */
export function DashboardModeToggle({ mode, onChange }: DashboardModeToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-gray-200/70 bg-white p-1 shadow-sm transition-all duration-200 hover:border-gray-300",
        mode === "advanced" && "border-gray-300/80 bg-gray-50"
      )}
    >
      <button
        type="button"
        onClick={() => onChange("lite")}
        className={cn(
          "relative rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          mode === "lite"
            ? "bg-blue-50 text-blue-700 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        )}
        aria-label="Lite mode"
        aria-pressed={mode === "lite"}
      >
        Lite
      </button>
      <button
        type="button"
        onClick={() => onChange("advanced")}
        className={cn(
          "relative rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          mode === "advanced"
            ? "bg-gray-900 text-white shadow-md font-semibold"
            : "text-gray-600 hover:text-gray-900"
        )}
        aria-label="Advanced mode"
        aria-pressed={mode === "advanced"}
      >
        Advanced
      </button>
    </div>
  );
}
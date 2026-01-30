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
        "inline-flex items-center rounded-full border border-border bg-card p-1 shadow-sm transition-all duration-200 hover:border-border/80",
        mode === "advanced" && "border-border/80 bg-muted"
      )}
    >
      <button
        type="button"
        onClick={() => onChange("lite")}
        className={cn(
          "relative rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 dark:focus:ring-offset-background",
          mode === "lite"
            ? "bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-950/50 dark:text-blue-300"
            : "text-muted-foreground hover:text-foreground"
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
          "relative rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 dark:focus:ring-offset-background",
          mode === "advanced"
            ? "bg-foreground text-background shadow-md font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Advanced mode"
        aria-pressed={mode === "advanced"}
      >
        Advanced
      </button>
    </div>
  );
}
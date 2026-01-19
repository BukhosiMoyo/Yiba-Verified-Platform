"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type HealthStatusPillStatus = "healthy" | "online" | "degraded" | "offline";

export interface HealthStatusPillProps {
  status: HealthStatusPillStatus;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<
  HealthStatusPillStatus,
  { label: string; icon: typeof CheckCircle2; styles: string }
> = {
  healthy: {
    label: "Healthy",
    icon: CheckCircle2,
    styles: "border-emerald-200/70 bg-emerald-50/60 text-emerald-700",
  },
  online: {
    label: "Online",
    icon: CheckCircle2,
    styles: "border-emerald-200/70 bg-emerald-50/60 text-emerald-700",
  },
  degraded: {
    label: "Degraded",
    icon: AlertTriangle,
    styles: "border-amber-200/70 bg-amber-50/60 text-amber-700",
  },
  offline: {
    label: "Offline",
    icon: XCircle,
    styles: "border-red-200/70 bg-red-50/60 text-red-700",
  },
};

export function HealthStatusPill({
  status,
  size = "sm",
  className,
}: HealthStatusPillProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.styles,
        size === "sm" && "px-2.5 py-1 text-xs",
        size === "md" && "px-3 py-1.5 text-sm",
        className
      )}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2} />
      {config.label}
    </span>
  );
}

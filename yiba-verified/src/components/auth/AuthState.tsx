import React from "react";
import { Loader2, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthStateVariant = "default" | "success" | "warning" | "error" | "info" | "loading";

interface AuthStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  variant?: AuthStateVariant;
  actions?: React.ReactNode;
  compact?: boolean;
}

const variantConfig: Record<
  AuthStateVariant,
  { iconColor: string; bgColor: string; defaultIcon: React.ReactNode }
> = {
  default: {
    iconColor: "text-muted-foreground",
    bgColor: "bg-muted",
    defaultIcon: <Info className="h-5 w-5" strokeWidth={1.5} />,
  },
  success: {
    iconColor: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10 dark:bg-green-500/20",
    defaultIcon: <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />,
  },
  warning: {
    iconColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    defaultIcon: <AlertTriangle className="h-5 w-5" strokeWidth={1.5} />,
  },
  error: {
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10 dark:bg-destructive/20",
    defaultIcon: <AlertCircle className="h-5 w-5" strokeWidth={1.5} />,
  },
  info: {
    iconColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    defaultIcon: <Info className="h-5 w-5" strokeWidth={1.5} />,
  },
  loading: {
    iconColor: "text-muted-foreground",
    bgColor: "bg-muted",
    defaultIcon: <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />,
  },
};

export function AuthState({
  icon,
  title,
  description,
  variant = "default",
  actions,
  compact = false,
}: AuthStateProps) {
  const config = variantConfig[variant];
  const displayIcon = icon !== undefined ? icon : config.defaultIcon;

  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "space-y-3" : "space-y-4")}>
      {/* Icon */}
      {displayIcon && (
        <div className={cn("rounded-full p-3", config.bgColor)}>
          <div className={config.iconColor}>{displayIcon}</div>
        </div>
      )}

      {/* Title */}
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>

      {/* Description */}
      {description && (
        <div className="text-sm text-muted-foreground leading-relaxed max-w-sm">
          {description}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className={cn("w-full", compact ? "mt-2" : "mt-4")}>{actions}</div>
      )}
    </div>
  );
}

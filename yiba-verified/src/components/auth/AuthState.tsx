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
    iconColor: "text-gray-500",
    bgColor: "bg-gray-100",
    defaultIcon: <Info className="h-5 w-5" strokeWidth={1.5} />,
  },
  success: {
    iconColor: "text-green-600",
    bgColor: "bg-green-100",
    defaultIcon: <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />,
  },
  warning: {
    iconColor: "text-amber-600",
    bgColor: "bg-amber-100",
    defaultIcon: <AlertTriangle className="h-5 w-5" strokeWidth={1.5} />,
  },
  error: {
    iconColor: "text-red-600",
    bgColor: "bg-red-100",
    defaultIcon: <AlertCircle className="h-5 w-5" strokeWidth={1.5} />,
  },
  info: {
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    defaultIcon: <Info className="h-5 w-5" strokeWidth={1.5} />,
  },
  loading: {
    iconColor: "text-gray-500",
    bgColor: "bg-gray-100",
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
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

      {/* Description */}
      {description && (
        <div className="text-sm text-gray-600 leading-relaxed max-w-sm">
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

"use client";

import { BadgeCheck, Shield, Building2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BADGE_CONFIG, type VerificationLevel } from "@/lib/verification";

interface VerificationBadgeProps {
  level: VerificationLevel;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const containerSizeClasses = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
};

function getBadgeIcon(level: VerificationLevel, size: "sm" | "md" | "lg") {
  const iconClass = sizeClasses[size];

  switch (level) {
    case "BLUE":
      return <BadgeCheck className={cn(iconClass, "text-blue-600 dark:text-blue-400")} strokeWidth={2} />;
    case "GREEN":
      return <Building2 className={cn(iconClass, "text-green-600 dark:text-green-400")} strokeWidth={2} />;
    case "GOLD":
      return <Crown className={cn(iconClass, "text-amber-500 dark:text-amber-400")} strokeWidth={2} />;
    case "BLACK":
      return <Shield className={cn(iconClass, "text-gray-900 dark:text-gray-100")} strokeWidth={2} />;
    default:
      return null;
  }
}

export function VerificationBadge({
  level,
  size = "md",
  showTooltip = true,
  className,
}: VerificationBadgeProps) {
  if (level === "NONE") {
    return null;
  }

  const config = BADGE_CONFIG[level];
  const icon = getBadgeIcon(level, size);

  if (!icon) return null;

  const badge = (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full shrink-0",
        containerSizeClasses[size],
        className
      )}
    >
      {icon}
    </div>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <div className="text-center">
            <p className="font-semibold">{config.label}</p>
            {config.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.description}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Avatar overlay badge - positioned on bottom-right of avatar
 */
interface AvatarBadgeOverlayProps {
  level: VerificationLevel;
  size?: "sm" | "md" | "lg";
}

const overlayPositionClasses = {
  sm: "-bottom-0.5 -right-0.5 h-4 w-4",
  md: "-bottom-0.5 -right-0.5 h-5 w-5",
  lg: "-bottom-1 -right-1 h-6 w-6",
};

const overlayIconClasses = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
};

export function AvatarBadgeOverlay({ level, size = "md" }: AvatarBadgeOverlayProps) {
  if (level === "NONE") {
    return null;
  }

  const getOverlayIcon = () => {
    const iconClass = overlayIconClasses[size];
    switch (level) {
      case "BLUE":
        return <BadgeCheck className={cn(iconClass, "text-blue-600 dark:text-blue-400")} strokeWidth={2.5} />;
      case "GREEN":
        return <BadgeCheck className={cn(iconClass, "text-green-600 dark:text-green-400")} strokeWidth={2.5} />;
      case "GOLD":
        return <BadgeCheck className={cn(iconClass, "text-amber-500 dark:text-amber-400")} strokeWidth={2.5} />;
      case "BLACK":
        return <BadgeCheck className={cn(iconClass, "text-gray-900 dark:text-gray-100")} strokeWidth={2.5} />;
      default:
        return null;
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute rounded-full bg-white dark:bg-card flex items-center justify-center shadow-sm border border-white dark:border-card",
              overlayPositionClasses[size]
            )}
          >
            {getOverlayIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-medium">{BADGE_CONFIG[level].label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Pill badge - shows label text
 */
interface VerificationPillProps {
  level: VerificationLevel;
  showIcon?: boolean;
  className?: string;
}

export function VerificationPill({ level, showIcon = true, className }: VerificationPillProps) {
  if (level === "NONE") {
    return null;
  }

  const config = BADGE_CONFIG[level];

  const getIcon = () => {
    const iconClass = "h-3 w-3";
    switch (level) {
      case "BLUE":
        return <BadgeCheck className={cn(iconClass, "text-blue-600 dark:text-blue-400")} strokeWidth={2} />;
      case "GREEN":
        return <BadgeCheck className={cn(iconClass, "text-green-600 dark:text-green-400")} strokeWidth={2} />;
      case "GOLD":
        return <BadgeCheck className={cn(iconClass, "text-amber-500 dark:text-amber-400")} strokeWidth={2} />;
      case "BLACK":
        return <BadgeCheck className={cn(iconClass, "text-white dark:text-gray-900")} strokeWidth={2} />;
      default:
        return null;
    }
  };

  const pillColors = {
    BLUE: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    GREEN: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
    GOLD: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    BLACK: "bg-gray-900 text-white border-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-300",
    NONE: "",
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0",
              pillColors[level],
              className
            )}
          >
            {showIcon && getIcon()}
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

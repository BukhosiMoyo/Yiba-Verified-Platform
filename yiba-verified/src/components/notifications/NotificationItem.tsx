"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  type Notification,
  NOTIFICATION_CATEGORIES,
  PRIORITY_CONFIG,
  getCategoryFromType,
  getNotificationLink,
  formatTimeAgo,
} from "./types";

interface NotificationItemProps {
  notification: Notification;
  index?: number;
  onMarkRead?: (id: string) => void;
  onNavigate?: (url: string) => void;
  /** Viewer role for role-aware links (QCTO vs institution paths) */
  viewerRole?: string | null;
}

export function NotificationItem({
  notification,
  index = 0,
  onMarkRead,
  onNavigate,
  viewerRole,
}: NotificationItemProps) {
  const category = notification.category || getCategoryFromType(notification.notification_type);
  const config = NOTIFICATION_CATEGORIES[category] || NOTIFICATION_CATEGORIES.default;
  const priority = notification.priority || "MEDIUM";
  const priorityConfig = PRIORITY_CONFIG[priority];
  const Icon = config.icon;
  const link = getNotificationLink(notification, viewerRole);

  const handleClick = () => {
    if (!notification.is_read && onMarkRead) {
      onMarkRead(notification.notification_id);
    }
    if (link && onNavigate) {
      onNavigate(link);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative px-4 py-4 cursor-pointer transition-all duration-200",
        "hover:bg-muted/50 dark:hover:bg-muted/30",
        !notification.is_read && "bg-primary/5 dark:bg-primary/10",
        link && "cursor-pointer"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105",
            config.iconBg
          )}
        >
          <Icon className={cn("h-5 w-5", config.text)} strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className={cn(
                "text-sm font-semibold leading-tight truncate",
                notification.is_read 
                  ? "text-foreground/80" 
                  : "text-foreground"
              )}>
                {notification.title}
              </h4>
              {/* Unread indicator */}
              {!notification.is_read && (
                <span className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  priority === "URGENT" ? "bg-red-500 animate-pulse" : "bg-primary"
                )} />
              )}
            </div>
          </div>

          {/* Message */}
          <p className={cn(
            "text-sm leading-relaxed line-clamp-2 mb-2",
            notification.is_read 
              ? "text-muted-foreground/80" 
              : "text-muted-foreground"
          )}>
            {notification.message}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 h-5 font-medium border-0",
                config.bgLight,
                config.bgDark,
                config.text
              )}
            >
              {config.label}
            </Badge>

            {/* Priority badge (only for HIGH/URGENT) */}
            {(priority === "HIGH" || priority === "URGENT") && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-5 font-medium border-0",
                  priorityConfig.badge
                )}
              >
                {priorityConfig.label}
              </Badge>
            )}

            {/* Time */}
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(notification.created_at)}
            </span>
          </div>
        </div>

        {/* Hover action hint */}
        {link && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-muted-foreground self-center">
            View →
          </div>
        )}
      </div>
    </div>
  );
}

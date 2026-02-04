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
import { Archive, Trash2, Undo2 } from "lucide-react";

interface NotificationItemProps {
  notification: Notification;
  index?: number;
  onMarkRead?: (id: string) => void;
  onNavigate?: (url: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  /** Viewer role for role-aware links (QCTO vs institution paths) */
  viewerRole?: string | null;
}

export function NotificationItem({
  notification,
  index = 0,
  onMarkRead,
  onNavigate,
  onArchive,
  onRestore,
  onDelete,
  viewerRole,
}: NotificationItemProps) {
  const category = notification.category || getCategoryFromType(notification.notification_type);
  const config = NOTIFICATION_CATEGORIES[category] || NOTIFICATION_CATEGORIES.default;
  const priority = notification.priority || "NORMAL";
  const priorityConfig = PRIORITY_CONFIG[priority];
  const Icon = config.icon;
  const link = getNotificationLink(notification, viewerRole);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking archive button
    if ((e.target as HTMLElement).closest('button')) return;

    if (!notification.is_read && onMarkRead) {
      onMarkRead(notification.notification_id);
    }
    if (link && onNavigate && !notification.is_archived) {
      onNavigate(link);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive?.(notification.notification_id);
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
                  priority === "CRITICAL" ? "bg-red-500 animate-pulse" : "bg-primary"
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

            {/* Priority badge (only for HIGH/CRITICAL) */}
            {(priority === "HIGH" || priority === "CRITICAL") && (
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
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-center">
          {onArchive && !notification.is_archived && (
            <button
              onClick={handleArchive}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-full transition-colors"
              title="Archive"
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
          {notification.is_archived && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onRestore?.(notification.notification_id); }}
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors"
                title="Restore"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(notification.notification_id); }}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-full transition-colors"
                title="Delete Permanently"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          {link && (
            <div className="text-xs text-muted-foreground mr-1">
              View →
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

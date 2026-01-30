"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Settings, Archive, CheckCheck, Megaphone, Bell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationItem } from "./NotificationItem";
import { NotificationFilters } from "./NotificationFilters";
import { AnnouncementCard } from "./AnnouncementCard";
import { NotificationSettings } from "./NotificationSettings";
import {
  type Notification,
  type Announcement,
  type FilterOption,
  getCategoryFromType,
  groupNotificationsByDate,
} from "./types";

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadCountChange?: (count: number) => void;
  /** Viewer role for role-aware notification links (QCTO vs institution) */
  viewerRole?: string | null;
}

export function NotificationPanel({
  open,
  onOpenChange,
  onUnreadCountChange,
  viewerRole,
}: NotificationPanelProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Fetch data when panel opens
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [notifRes, annRes] = await Promise.all([
          fetch("/api/notifications?limit=20"),
          fetch("/api/announcements"),
        ]);

        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data.items || []);
          setUnreadCount(data.unread_count || 0);
          onUnreadCountChange?.(data.unread_count || 0);
        }

        if (annRes.ok) {
          const data = await annRes.json();
          setAnnouncements(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [open, onUnreadCountChange]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach((n) => {
      const cat = n.category || getCategoryFromType(n.notification_type);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    if (activeFilter === "unread") return notifications.filter((n) => !n.is_read);
    // Filter by category
    return notifications.filter((n) => {
      const cat = n.category || getCategoryFromType(n.notification_type);
      return cat === activeFilter;
    });
  }, [notifications, activeFilter]);

  // Group by date
  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(filteredNotifications),
    [filteredNotifications]
  );

  // Mark single as read
  const handleMarkRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => {
          const newCount = Math.max(0, prev - 1);
          onUnreadCountChange?.(newCount);
          return newCount;
        });
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, [onUnreadCountChange]);

  // Mark all as read (batch API)
  const handleMarkAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    onUnreadCountChange?.(0);

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      });
      if (!res.ok) {
        console.error("Failed to mark all as read");
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, [onUnreadCountChange]);

  // Navigate to link
  const handleNavigate = useCallback((url: string) => {
    router.push(url);
    onOpenChange(false);
  }, [router, onOpenChange]);

  // Close panel
  const handleClose = useCallback(() => {
    onOpenChange(false);
    setSettingsOpen(false);
  }, [onOpenChange]);

  // Open settings
  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  // Back from settings
  const handleBackFromSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const dateGroups = Object.keys(groupedNotifications);
  const hasContent = announcements.length > 0 || notifications.length > 0;

  // Use portal to render outside overflow-hidden containers
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-all duration-500 ease-out",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed z-50 flex flex-col",
          "inset-y-[10px] right-[10px] w-full sm:w-[440px] md:w-[480px]",
          "h-[calc(100vh-20px)] rounded-2xl",
          "bg-card border border-border shadow-2xl",
          "transform-gpu transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open
            ? "translate-x-0 opacity-100"
            : "translate-x-[calc(100%+20px)] opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/60">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            {!isLoading && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenSettings}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <NotificationFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          unreadCount={unreadCount}
          categoryCounts={categoryCounts}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasContent ? (
            <div className="flex flex-col items-center justify-center h-64 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">All caught up!</p>
              <p className="text-xs text-muted-foreground">
                No notifications or announcements right now
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {/* Announcements section */}
              {announcements.length > 0 && activeFilter === "all" && (
                <>
                  <div className="px-4 py-2 bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Megaphone className="h-3.5 w-3.5" />
                      Announcements
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                        {announcements.length}
                      </Badge>
                    </div>
                  </div>
                  {announcements.slice(0, 3).map((announcement) => (
                    <AnnouncementCard
                      key={announcement.announcement_id}
                      announcement={announcement}
                      onClose={handleClose}
                    />
                  ))}
                </>
              )}

              {/* Notifications by date group */}
              {dateGroups.map((group) => (
                <div key={group}>
                  <div className="px-4 py-2 bg-muted/30">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group}
                    </span>
                  </div>
                  {groupedNotifications[group].map((notification, index) => (
                    <NotificationItem
                      key={notification.notification_id}
                      notification={notification}
                      index={index}
                      onMarkRead={handleMarkRead}
                      onNavigate={handleNavigate}
                      viewerRole={viewerRole}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-border/60 bg-muted/30">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => {
                  // TODO: Implement archive all
                }}
              >
                <Archive className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                Archive all
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                Mark all read
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <NotificationSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onBack={handleBackFromSettings}
      />
    </>,
    document.body
  );
}

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
  const [activeTab, setActiveTab] = useState<"inbox" | "archived">("inbox");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  // Fetch data when panel opens
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      if (page === 0) setIsLoading(true);
      try {
        const [notifRes, annRes] = await Promise.all([
          fetch(`/api/notifications?limit=${LIMIT}&offset=${page * LIMIT}&archived=${activeTab === "archived"}`),
          page === 0 ? fetch("/api/announcements") : Promise.resolve(null),
        ]);

        if (notifRes.ok) {
          const data = await notifRes.json();
          const newItems = data.items || [];

          setNotifications(prev => page === 0 ? newItems : [...prev, ...newItems]);
          setHasMore(newItems.length === LIMIT);
          setUnreadCount(data.unread_count || 0);
          onUnreadCountChange?.(data.unread_count || 0);
        }

        if (annRes && annRes.ok) {
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
  }, [open, page, activeTab, onUnreadCountChange]);

  // Reset pagination when tab changes
  useEffect(() => {
    setPage(0);
    setNotifications([]);
    setHasMore(true);
  }, [activeTab]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

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
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, [onUnreadCountChange]);

  // Archive single
  const handleArchive = useCallback(async (notificationId: string) => {
    // Optimistic remove
    setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));

    // Check if it was unread
    const wasUnread = notifications.find(n => n.notification_id === notificationId && !n.is_read);
    if (wasUnread) {
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        onUnreadCountChange?.(newCount);
        return newCount;
      });
    }

    try {
      await fetch(`/api/notifications/${notificationId}`, { method: "DELETE" });
    } catch (error) {
      console.error("Failed to archive notification", error);
    }
  }, [notifications, onUnreadCountChange]);

  // Archive all
  const handleArchiveAll = useCallback(async () => {
    if (!confirm("Are you sure you want to archive all notifications?")) return;

    setNotifications([]);
    setUnreadCount(0);
    onUnreadCountChange?.(0);

    try {
      await fetch("/api/notifications", { method: "DELETE" });
    } catch (error) {
      console.error("Failed to archive all", error);
    }
  }, [onUnreadCountChange]);

  // Restore single
  const handleRestore = useCallback(async (notificationId: string) => {
    // Optimistic remove from archive list
    setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));

    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restored: true }),
      });
    } catch (error) {
      console.error("Failed to restore notification", error);
    }
  }, []);

  // Permanent Delete
  const handleDelete = useCallback(async (notificationId: string) => {
    if (!confirm("Delete permanently?")) return;
    setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
    try {
      await fetch(`/api/notifications/${notificationId}?permanent=true`, { method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  }, []);

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
          "fixed z-50 bg-black/30 backdrop-blur-[2px] transition-all duration-500 ease-out",
          "inset-0 top-16 md:top-0", // Mobile: start below header. Desktop: full screen.
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed z-50 flex flex-col bg-card border border-border shadow-2xl transform-gpu transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          // Mobile: Below header (top-16), full width, no rounded corners
          "top-16 bottom-0 right-0 left-0 w-full",
          // Desktop: Floating from right, rounded
          "md:top-[10px] md:bottom-[10px] md:left-auto md:right-[10px] md:w-[480px] md:rounded-2xl md:h-[calc(100vh-20px)]",
          open
            ? "translate-x-0 opacity-100"
            : "translate-x-[100%] opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("inbox")}
                className={cn(
                  "text-lg font-semibold transition-colors",
                  activeTab === "inbox" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
                )}
              >
                Inbox
              </button>
              <div className="h-4 w-px bg-border/60" />
              <button
                onClick={() => setActiveTab("archived")}
                className={cn(
                  "text-lg font-semibold transition-colors",
                  activeTab === "archived" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
                )}
              >
                Archived
              </button>
            </div>
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
                      onArchive={handleArchive}
                      onRestore={handleRestore}
                      onDelete={handleDelete}
                      viewerRole={viewerRole}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Load More Trigger */}
          {hasMore && !isLoading && notifications.length > 0 && (
            <div className="p-4 text-center">
              <Button variant="ghost" size="sm" onClick={loadMore} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load older notifications"}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && activeTab === "inbox" && (
          <div className="px-4 py-3 border-t border-border/60 bg-muted/30">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleArchiveAll}
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

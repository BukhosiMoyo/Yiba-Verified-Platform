"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Bell, CheckCheck, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import {
  type Notification,
  type FilterOption,
  NOTIFICATION_CATEGORIES,
  getCategoryFromType,
  groupNotificationsByDate,
} from "@/components/notifications/types";

interface NotificationsPageClientProps {
  viewerRole?: string | null;
}

export function NotificationsPageClient({ viewerRole }: NotificationsPageClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [total, setTotal] = useState(0);

  // Fetch notifications
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/notifications?limit=100");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.items || []);
          setUnreadCount(data.unread_count || 0);
          setTotal(data.count ?? 0);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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

  // Mark as read
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
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  // Mark all as read (batch API)
  const handleMarkAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      });
      if (!res.ok) console.error("Failed to mark all as read");
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  // Navigate
  const handleNavigate = useCallback((url: string) => {
    window.location.href = url;
  }, []);

  const dateGroups = Object.keys(groupedNotifications);
  const filterTabs = [
    { id: "all" as FilterOption, label: "All", count: notifications.length },
    { id: "unread" as FilterOption, label: "Unread", count: unreadCount },
    ...Object.entries(categoryCounts).slice(0, 4).map(([cat, count]) => ({
      id: cat as FilterOption,
      label: NOTIFICATION_CATEGORIES[cat]?.label || cat,
      count,
    })),
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"} · {total} total
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Mark all read
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {filterTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeFilter === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(tab.id)}
            className="whitespace-nowrap"
          >
            {tab.label}
            {tab.count > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {tab.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {activeFilter === "unread" ? "No unread notifications" : "No notifications"}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeFilter === "unread"
                  ? "You've read all your notifications"
                  : "Notifications will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {dateGroups.map((group) => (
                <div key={group}>
                  <div className="px-4 py-2 bg-muted/30 sticky top-0">
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
        </CardContent>
      </Card>
    </div>
  );
}

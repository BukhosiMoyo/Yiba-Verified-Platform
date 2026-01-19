"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Notification {
  notification_id: string;
  notification_type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotificationListProps {
  initialFilters?: {
    is_read?: string;
    limit?: string;
    offset?: string;
  };
}

/**
 * NotificationList Component
 * 
 * Client component that displays a list of notifications with filtering and pagination.
 */
export function NotificationList({ initialFilters }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "read" | "unread">(
    initialFilters?.is_read === "true" ? "read" : initialFilters?.is_read === "false" ? "unread" : "all"
  );

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "read") params.set("is_read", "true");
      if (filter === "unread") params.set("is_read", "false");
      if (initialFilters?.limit) params.set("limit", initialFilters.limit);
      if (initialFilters?.offset) params.set("offset", initialFilters.offset);

      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.items || []);
        setUnreadCount(data.unread_count || 0);
        setTotalCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    for (const notification of unreadNotifications) {
      await handleMarkAsRead(notification.notification_id);
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (!notification.entity_type || !notification.entity_id) {
      return null;
    }

    switch (notification.entity_type) {
      case "SUBMISSION":
        return `/institution/submissions/${notification.entity_id}`;
      case "QCTO_REQUEST":
        return `/institution/requests/${notification.entity_id}`;
      case "READINESS":
        return `/institution/readiness/${notification.entity_id}`;
      case "DOCUMENT":
        return `/institution/documents/${notification.entity_id}`;
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>
              {totalCount} notification{totalCount !== 1 ? "s" : ""} • {unreadCount} unread
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === "read" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("read")}
          >
            Read
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No notifications found
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const content = (
                <div
                  className={`p-4 border rounded-lg ${
                    !notification.is_read ? "bg-blue-50/50 border-blue-200" : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{notification.title}</p>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatTimeAgo(notification.created_at)}</span>
                        {notification.read_at && (
                          <span>Read {formatTimeAgo(notification.read_at)}</span>
                        )}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.notification_id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              );

              if (link) {
                return (
                  <Link key={notification.notification_id} href={link}>
                    {content}
                  </Link>
                );
              }

              return <div key={notification.notification_id}>{content}</div>;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

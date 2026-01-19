"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface NotificationDropdownProps {
  onClose: () => void;
  onMarkRead?: () => void;
}

/**
 * NotificationDropdown Component
 * 
 * Dropdown menu showing recent notifications with mark as read functionality.
 */
export function NotificationDropdown({ onClose, onMarkRead }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?limit=10");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.items || []);
          setUnreadCount(data.unread_count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        onMarkRead?.();
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
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
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 z-50"
    >
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} unread</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const NotificationContent = (
                  <div
                    className={`p-4 hover:bg-muted/50 cursor-pointer ${
                      !notification.is_read ? "bg-blue-50/50" : ""
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.notification_id);
                      }
                      if (link) {
                        window.location.href = link;
                      }
                      onClose();
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );

                return <div key={notification.notification_id}>{NotificationContent}</div>;
              })}
            </div>
          )}
          {notifications.length > 0 && (
            <div className="p-3 border-t">
              <Link href="/notifications">
                <Button variant="outline" size="sm" className="w-full">
                  View All Notifications
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

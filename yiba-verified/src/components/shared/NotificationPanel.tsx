"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, Archive, CheckCheck, Megaphone, AlertCircle, Info, AlertTriangle, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

interface AnnouncementItem {
  announcement_id: string;
  title: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  created_by: { name: string };
  created_at: string;
  expires_at: string | null;
}

const priorityConfig = {
  LOW: { label: "Low", icon: Info, className: "bg-blue-100 text-blue-700" },
  MEDIUM: { label: "Medium", icon: Bell, className: "bg-gray-100 text-gray-700" },
  HIGH: { label: "High", icon: AlertTriangle, className: "bg-amber-100 text-amber-700" },
  URGENT: { label: "Urgent", icon: AlertCircle, className: "bg-red-100 text-red-700" },
};

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkRead?: () => void;
}

/**
 * NotificationPanel Component
 *
 * Slide-over panel showing notifications with actions.
 */
export function NotificationPanel({ open, onOpenChange, onMarkRead }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications and announcements when panel opens
  useEffect(() => {
    if (!open) return;

    const load = async () => {
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
        }
        if (annRes.ok) {
          const data = await annRes.json();
          setAnnouncements(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [open]);

  const handleMarkAsRead = async (notificationId: string) => {
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
        onMarkRead?.();
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

  const handleArchiveAll = async () => {
    // TODO: Implement archive all functionality
    console.log("Archive all notifications");
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

  const getInitials = (text: string) => {
    return text
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[512px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100/60">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold text-gray-900 leading-tight">Notifications</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-50 -me-2"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-sm text-gray-500">
              Loading...
            </div>
          ) : announcements.length === 0 && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
              <p className="text-sm text-gray-500">No announcements or notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100/60">
              {/* Announcements section */}
              {announcements.length > 0 && (
                <>
                  <div className="px-6 py-3 bg-muted/30 border-b border-gray-100/60 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      <Megaphone className="h-3.5 w-3.5" />
                      Announcements
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-medium">
                        {announcements.length}
                      </Badge>
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                      <Link href="/announcements" onClick={() => onOpenChange(false)}>
                        View all
                      </Link>
                    </Button>
                  </div>
                  {announcements.slice(0, 5).map((a) => {
                    const config = priorityConfig[a.priority];
                    const Icon = config.icon;
                    return (
                      <Link
                        key={a.announcement_id}
                        href="/announcements"
                        onClick={() => onOpenChange(false)}
                        className="block px-6 py-4 hover:bg-gray-50/60 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-100 text-amber-700">
                            <Icon className="h-4 w-4" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-semibold text-gray-900 leading-tight">{a.title}</p>
                              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", config.className)}>
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {(() => {
                                const plain = (a.message || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                                return plain.length > 150 ? plain.slice(0, 150) + "…" : plain;
                              })()}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {a.created_by?.name} · {formatTimeAgo(a.created_at)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {notifications.length > 0 && (
                    <div className="px-6 py-2 bg-muted/20 border-b border-gray-100/60">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notifications</span>
                    </div>
                  )}
                </>
              )}
              {notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const initials = getInitials(notification.title || "N");

                return (
                  <div
                    key={notification.notification_id}
                    className={cn(
                      "px-6 py-4 hover:bg-gray-50/60 transition-colors duration-200 cursor-pointer",
                      !notification.is_read && "bg-blue-50/30"
                    )}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.notification_id);
                      }
                      if (link) {
                        window.location.href = link;
                        onOpenChange(false);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {initials}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatTimeAgo(notification.created_at)}</span>
                          {notification.entity_type && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                                {notification.entity_type.replace("_", " ")}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100/60 bg-gray-50/30">
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
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
                Mark all as read
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

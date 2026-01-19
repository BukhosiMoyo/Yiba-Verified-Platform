"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationPanel } from "./NotificationPanel";

/**
 * NotificationBell Component
 * 
 * Displays a bell icon with unread count badge and opens slide-over panel.
 */
export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications?is_read=false&limit=1");
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unread_count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnreadCount();
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label="Notifications"
        className="relative h-9 w-9 border-transparent text-blue-700 hover:text-blue-800 hover:bg-blue-50/80 transition-colors duration-200"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] font-semibold min-w-[16px]"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
      
      <NotificationPanel
        open={isOpen}
        onOpenChange={setIsOpen}
        onMarkRead={() => {
          // Refresh unread count when a notification is marked as read
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }}
      />
    </>
  );
}

"use client";

import { useState, useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotificationPanel } from "./NotificationPanel";

interface NotificationBellProps {
  className?: string;
  /** Viewer role for role-aware notification links in panel */
  viewerRole?: string | null;
}

const UNREAD_KEY = "/api/notifications?is_read=false&limit=1";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  const data = await res.json();
  return {
    unread_count: typeof data.unread_count === "number" ? data.unread_count : 0,
    items: data.items ?? [],
  };
};

export function NotificationBell({ className, viewerRole }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, mutate } = useSWR<{ unread_count: number; items: unknown[] }>(
    UNREAD_KEY,
    fetcher,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: true,
      refreshInterval: 30000,
    }
  );

  const unreadCount = data?.unread_count ?? 0;

  const handleUnreadCountChange = useCallback(
    (count: number) => {
      mutate({ unread_count: count, items: data?.items ?? [] }, { revalidate: false });
    },
    [mutate, data?.items]
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className={cn(
          "relative h-9 w-9 rounded-lg border border-border/60 text-muted-foreground",
          "hover:text-foreground hover:bg-muted hover:border-border",
          "dark:border-border/60 dark:hover:border-border",
          "transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />

        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 flex items-center justify-center",
              "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold",
              "bg-destructive text-destructive-foreground",
              "border-2 border-background ring-2 ring-destructive/30",
              "animate-in fade-in zoom-in duration-200"
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <NotificationPanel
        open={isOpen}
        onOpenChange={setIsOpen}
        onUnreadCountChange={handleUnreadCountChange}
        viewerRole={viewerRole}
      />
    </>
  );
}

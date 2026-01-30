"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Megaphone, AlertCircle, AlertTriangle, Info, Bell } from "lucide-react";
import { type Announcement, formatTimeAgo } from "./types";
import Link from "next/link";

interface AnnouncementCardProps {
  announcement: Announcement;
  onClose?: () => void;
}

const priorityConfig = {
  LOW: { 
    icon: Info, 
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
  },
  MEDIUM: { 
    icon: Bell, 
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    iconBg: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  HIGH: { 
    icon: AlertTriangle, 
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
  },
  URGENT: { 
    icon: AlertCircle, 
    className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    iconBg: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
  },
};

export function AnnouncementCard({ announcement, onClose }: AnnouncementCardProps) {
  const config = priorityConfig[announcement.priority];
  const Icon = config.icon;
  const authorName = announcement.created_by_name || announcement.created_by?.name || "System";

  // Strip HTML tags for preview
  const plainMessage = (announcement.message || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const preview = plainMessage.length > 120 ? plainMessage.slice(0, 120) + "…" : plainMessage;

  return (
    <Link
      href="/announcements"
      onClick={onClose}
      className="block px-4 py-4 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors duration-200"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          config.iconBg
        )}>
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-foreground leading-tight truncate">
              {announcement.title}
            </h4>
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 h-5 font-medium border-0", config.className)}
            >
              {announcement.priority}
            </Badge>
          </div>

          {/* Message preview */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {preview}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{authorName}</span>
            <span>·</span>
            <span>{formatTimeAgo(announcement.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

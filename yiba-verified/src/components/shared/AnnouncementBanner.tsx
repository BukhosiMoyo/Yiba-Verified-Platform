"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle, Info, AlertTriangle, Bell } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { SanitizedHtml } from "@/components/shared/SanitizedHtml";
import { cn } from "@/lib/utils";

interface Announcement {
  announcement_id: string;
  title: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  created_by?: {
    name?: string;
    role?: string;
  };
  created_at: string;
  expires_at: string | null;
}

interface AnnouncementBannerProps {
  className?: string;
}

const priorityConfig = {
  LOW: {
    variant: "info" as const,
    icon: Info,
    className: "border-blue-200/60 bg-blue-50/50",
  },
  MEDIUM: {
    variant: "default" as const,
    icon: Bell,
    className: "border-gray-200/60 bg-gray-50",
  },
  HIGH: {
    variant: "warning" as const,
    icon: AlertTriangle,
    className: "border-amber-200/60 bg-amber-50/50",
  },
  URGENT: {
    variant: "error" as const,
    icon: AlertCircle,
    className: "border-red-200/60 bg-red-50/50",
  },
};

export function AnnouncementBanner({ className }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcements");
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();

    // Load dismissed announcements from localStorage
    const stored = localStorage.getItem("yv_dismissed_announcements");
    if (stored) {
      try {
        const dismissed = JSON.parse(stored);
        setDismissedIds(new Set(dismissed));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const handleDismiss = (announcementId: string) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(announcementId);
    setDismissedIds(newDismissed);
    
    // Store in localStorage
    localStorage.setItem("yv_dismissed_announcements", JSON.stringify(Array.from(newDismissed)));
  };

  if (isLoading) {
    return null;
  }

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(
    (announcement) => !dismissedIds.has(announcement.announcement_id)
  );

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  // Show only the highest priority announcement (first one after sorting)
  const topAnnouncement = visibleAnnouncements[0];
  const config = priorityConfig[topAnnouncement.priority];
  const Icon = config.icon;

  return (
    <div className={cn("border-b", config.className, className)}>
      <div className="mx-auto max-w-[1200px] px-6 py-3 md:px-8 lg:px-12">
        <Alert
          variant={config.variant}
          className="mb-0 border-0 bg-transparent p-0"
        >
          <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-1">
                {topAnnouncement.title}
              </h4>
              <SanitizedHtml
                html={topAnnouncement.message}
                className="text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4"
              />
            </div>
            <button
              onClick={() => handleDismiss(topAnnouncement.announcement_id)}
              className="h-6 w-6 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-colors duration-150 flex items-center justify-center shrink-0"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </Alert>
      </div>
    </div>
  );
}

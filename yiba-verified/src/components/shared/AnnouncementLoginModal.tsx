"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info, AlertTriangle, Bell } from "lucide-react";
import { SanitizedHtml } from "@/components/shared/SanitizedHtml";

interface Announcement {
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

const STORAGE_KEY = "yv_announcements_popup_seen";
const DELAY_MS = 300; // Reduced delay since it shows after welcome modal

interface AnnouncementLoginModalProps {
  enabled?: boolean; // Control when the modal should start checking for announcements
}

export function AnnouncementLoginModal({ enabled = true }: AnnouncementLoginModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const parsed = stored ? (() => { try { return JSON.parse(stored) as string[]; } catch { return []; } })() : [];
    setSeenIds(new Set(parsed));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !enabled || typeof window === "undefined") return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/announcements");
        if (!res.ok) return;
        const data = await res.json();
        const list: Announcement[] = data.items || [];
        setAnnouncements(list);
      } catch {
        return;
      }
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [ready, enabled]);

  // When we have announcements, filter unseen and open if any
  useEffect(() => {
    if (!ready || announcements.length === 0) return;
    const unseen = announcements.filter((a) => !seenIds.has(a.announcement_id));
    if (unseen.length > 0) {
      setIndex(0);
      setOpen(true);
    }
  }, [ready, announcements, seenIds]);

  const unseen = announcements.filter((a) => !seenIds.has(a.announcement_id));
  const current = unseen[index];
  const hasNext = index < unseen.length - 1;

  const markSeen = (id: string) => {
    const next = new Set(seenIds).add(id);
    setSeenIds(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    }
  };

  const handleGotIt = () => {
    if (current) markSeen(current.announcement_id);
    if (hasNext) setIndex((i) => i + 1);
    else setOpen(false);
  };

  const handleViewAll = () => {
    if (current) markSeen(current.announcement_id);
    setOpen(false);
    router.push("/announcements");
  };

  const handleClose = () => {
    if (current) markSeen(current.announcement_id);
    setOpen(false);
  };

  if (!current) return null;

  const config = priorityConfig[current.priority];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl border border-gray-200/70 bg-white p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <DialogTitle className="text-lg">{current.title}</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  {current.created_by?.name} · {new Date(current.created_at).toLocaleDateString()}
                </DialogDescription>
              </div>
            </div>
            <Badge className={config.className}>{config.label}</Badge>
          </div>
        </DialogHeader>
        <div className="px-6 py-2 max-h-[240px] overflow-y-auto">
          <SanitizedHtml
            html={current.message}
            className="text-sm text-muted-foreground [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4"
          />
        </div>
        <DialogFooter className="px-6 py-4 border-t border-gray-100 flex-row justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {unseen.length > 1 && (
              <span>
                {index + 1} of {unseen.length}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleViewAll}>
              View all
            </Button>
            <Button size="sm" onClick={handleGotIt}>
              {hasNext ? "Next" : "Got it"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

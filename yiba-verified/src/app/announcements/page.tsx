"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info, AlertTriangle, Bell, Settings } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { SanitizedHtml } from "@/components/shared/SanitizedHtml";

interface Announcement {
  announcement_id: string;
  title: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  created_by: { name: string; email: string };
  expires_at: string | null;
  created_at: string;
}

const priorityConfig = {
  LOW: { label: "Low", icon: Info, className: "bg-blue-100 text-blue-700" },
  MEDIUM: { label: "Medium", icon: Bell, className: "bg-gray-100 text-gray-700" },
  HIGH: { label: "High", icon: AlertTriangle, className: "bg-amber-100 text-amber-700" },
  URGENT: { label: "Urgent", icon: AlertCircle, className: "bg-red-100 text-red-700" },
};

type Role = "PLATFORM_ADMIN" | "INSTITUTION_ADMIN" | "INSTITUTION_STAFF" | "QCTO_USER" | "QCTO_SUPER_ADMIN" | "QCTO_ADMIN" | "QCTO_REVIEWER" | "QCTO_AUDITOR" | "QCTO_VIEWER" | "STUDENT";

export default function AnnouncementsViewPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [annRes, sessionRes] = await Promise.all([
          fetch("/api/announcements"),
          fetch("/api/auth/session"),
        ]);
        if (annRes.ok) {
          const data = await annRes.json();
          setAnnouncements(data.items || []);
        }
        if (sessionRes?.ok) {
          const s = await sessionRes.json();
          setRole(s?.user?.role ?? null);
        }
      } catch (e) {
        console.error("Failed to load announcements:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const isPlatformAdmin = role === "PLATFORM_ADMIN";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            System-wide announcements from the platform team
          </p>
        </div>
        {isPlatformAdmin && (
          <Button asChild>
            <Link href="/platform-admin/announcements" className="gap-2">
              <Settings className="h-4 w-4" />
              Manage Announcements
            </Link>
          </Button>
        )}
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="No announcements"
              description="There are no active announcements right now."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => {
            const config = priorityConfig[a.priority];
            const Icon = config.icon;
            return (
              <Card key={a.announcement_id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <CardTitle className="text-lg">{a.title}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                          <span>{a.created_by.name}</span>
                          <span>·</span>
                          <span>{new Date(a.created_at).toLocaleDateString()}</span>
                          {a.expires_at && (
                            <>
                              <span>·</span>
                              <span>Expires {new Date(a.expires_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={config.className}>{config.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <SanitizedHtml
                    html={a.message}
                    className="text-sm text-muted-foreground [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-4 [&_ol]:pl-4"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

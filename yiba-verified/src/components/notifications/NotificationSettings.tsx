"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Bell,
  Mail,
  Moon,
  Layout,
  Archive,
  Volume2,
  ChevronLeft,
  Save,
  RotateCcw,
  Loader2,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { NOTIFICATION_CATEGORIES } from "./types";
import { toast } from "sonner"; // Assuming sonner is used, or use standard toast

interface NotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack?: () => void;
}

// API Preference Shape
interface ApiPreference {
  category: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  sms_enabled: boolean;
  frequency: string;
}

export function NotificationSettings({
  open,
  onOpenChange,
  onBack,
}: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<ApiPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize checks
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        const items: ApiPreference[] = data.items || [];
        setPreferences(items);
      }
    } catch (e) {
      console.error("Failed to load preferences:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPreferences();
    }
  }, [open, fetchPreferences]);

  // Update specific preference
  const handleToggle = useCallback(async (category: string, channel: "email" | "in_app" | "sms", value: boolean) => {
    // Optimistic update
    setPreferences((prev) => {
      const existing = prev.find(p => p.category === category);
      if (existing) {
        return prev.map(p => p.category === category ? { ...p, [`${channel}_enabled`]: value } : p);
      }
      // Create new dummy entry if not exists (will be confirmed by API)
      return [...prev, {
        category,
        email_enabled: channel === "email" ? value : true, // Default true
        in_app_enabled: channel === "in_app" ? value : true,
        sms_enabled: channel === "sms" ? value : false,
        frequency: "IMMEDIATE"
      }];
    });

    // Send to API
    try {
      // Find current state to sync others
      const current = preferences.find(p => p.category === category) || {
        email_enabled: true, in_app_enabled: true, sms_enabled: false
      };

      const payload = {
        category,
        email_enabled: channel === "email" ? value : current.email_enabled,
        in_app_enabled: channel === "in_app" ? value : current.in_app_enabled,
        sms_enabled: channel === "sms" ? value : current.sms_enabled
      };

      await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // We could re-fetch to confirm, but optimistic is fine for now
    } catch (error) {
      console.error("Failed to update preference", error);
    }
  }, [preferences]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      onOpenChange(false);
    }
  }, [onBack, onOpenChange]);

  if (!mounted) return null;

  const categoryEntries = Object.entries(NOTIFICATION_CATEGORIES).filter(
    ([key]) => key !== "default"
  );

  // Helper to get state
  const getPref1 = (category: string) => preferences.find(p => p.category === category);
  const isEmail = (cat: string) => getPref1(cat)?.email_enabled ?? true;
  const isInApp = (cat: string) => getPref1(cat)?.in_app_enabled ?? true;

  return createPortal(
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-all duration-500 ease-out",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed z-50 flex flex-col",
          "inset-y-[10px] right-[10px] w-full sm:w-[500px] md:w-[540px]",
          "h-[calc(100vh-20px)] rounded-2xl",
          "bg-card border border-border shadow-2xl",
          "transform-gpu transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open
            ? "translate-x-0 opacity-100"
            : "translate-x-[calc(100%+20px)] opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Back"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Notification Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage your notification channels
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-5 space-y-6">

              {/* Channel Headers */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Category</div>
                <div className="w-12 text-center">App</div>
                <div className="w-12 text-center">Email</div>
              </div>

              {/* Categories */}
              <div className="space-y-1">
                {categoryEntries.map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div
                      key={key}
                      className="grid grid-cols-[1fr_auto_auto] gap-4 items-center py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-md", config.iconBg)}>
                          <Icon className={cn("h-4 w-4", config.text)} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none">{config.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Receive updates about {config.label.toLowerCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-center w-12">
                        <Switch
                          checked={isInApp(key.toUpperCase())}
                          onCheckedChange={(val) => handleToggle(key.toUpperCase(), "in_app", val)}
                          className="scale-90"
                        />
                      </div>

                      <div className="flex justify-center w-12">
                        <Switch
                          checked={isEmail(key.toUpperCase())}
                          onCheckedChange={(val) => handleToggle(key.toUpperCase(), "email", val)}
                          className="scale-90"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Global / Other Settings (Placeholder for now as schema doesn't support global well yet) */}

              <div className="border-t border-border/60 my-6" />

              <section>
                <h3 className="text-sm font-semibold text-foreground mb-4 px-1">Global Preferences</h3>
                <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 mb-2">
                    <Layout className="h-4 w-4" />
                    <span className="font-medium text-foreground">Note</span>
                  </div>
                  Critical system alerts and security notifications cannot be disabled and will always be sent via email and in-app.
                </div>
              </section>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/60 bg-muted/30 flex justify-end">
          <Button
            onClick={handleClose}
          >
            Done
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}


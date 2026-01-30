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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { NOTIFICATION_CATEGORIES } from "./types";

interface NotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack?: () => void;
}

// Settings interface
interface NotificationPreferences {
  // Category toggles
  categories: Record<string, boolean>;
  // Email preferences
  emailDigest: "off" | "immediate" | "daily" | "weekly";
  emailEnabled: boolean;
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  // Display options
  displayMode: "expanded" | "compact";
  groupBy: "date" | "category";
  showReadNotifications: boolean;
  // Auto-archive
  autoArchiveEnabled: boolean;
  autoArchiveDays: number;
  // Sound & browser
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  categories: {
    submission: true,
    request: true,
    readiness: true,
    document: true,
    team: true,
    student: true,
    system: true,
    deadline: true,
    invite: true,
  },
  emailDigest: "daily",
  emailEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  displayMode: "expanded",
  groupBy: "date",
  showReadNotifications: true,
  autoArchiveEnabled: false,
  autoArchiveDays: 30,
  soundEnabled: true,
  browserNotificationsEnabled: false,
};

const STORAGE_KEY = "notification-preferences";

export function NotificationSettings({
  open,
  onOpenChange,
  onBack,
}: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (e) {
      console.error("Failed to load notification preferences:", e);
    }
  }, []);

  // Update preference helper
  const updatePreference = useCallback(<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  // Toggle category
  const toggleCategory = useCallback((category: string) => {
    setPreferences((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category],
      },
    }));
    setHasChanges(true);
  }, []);

  // Save preferences
  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setHasChanges(false);
      // Could also send to API here for server-side persistence
    } catch (e) {
      console.error("Failed to save notification preferences:", e);
    }
  }, [preferences]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    setHasChanges(true);
  }, []);

  // Close handler
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle back (return to notification panel)
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

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-all duration-500 ease-out",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Settings Panel */}
      <div
        className={cn(
          "fixed z-50 flex flex-col",
          "inset-y-[10px] right-[10px] w-full sm:w-[440px] md:w-[480px]",
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
                Customize your notification experience
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
          <div className="p-5 space-y-6">
            {/* Category Preferences */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-foreground">Notification Categories</h3>
              </div>
              <div className="space-y-3">
                {categoryEntries.map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-1.5 rounded-md", config.iconBg)}>
                          <Icon className={cn("h-3.5 w-3.5", config.text)} strokeWidth={1.5} />
                        </div>
                        <Label htmlFor={`cat-${key}`} className="text-sm font-medium cursor-pointer">
                          {config.label}
                        </Label>
                      </div>
                      <Switch
                        id={`cat-${key}`}
                        checked={preferences.categories[key] ?? true}
                        onCheckedChange={() => toggleCategory(key)}
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-border/60" />

            {/* Email Preferences */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-foreground">Email Notifications</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Label htmlFor="email-enabled" className="text-sm font-medium cursor-pointer">
                    Enable email notifications
                  </Label>
                  <Switch
                    id="email-enabled"
                    checked={preferences.emailEnabled}
                    onCheckedChange={(checked) => updatePreference("emailEnabled", checked)}
                  />
                </div>
                <div className="px-3">
                  <Label htmlFor="email-digest" className="text-sm font-medium mb-2 block">
                    Email digest frequency
                  </Label>
                  <Select
                    id="email-digest"
                    value={preferences.emailDigest}
                    onChange={(e) =>
                      updatePreference("emailDigest", e.target.value as NotificationPreferences["emailDigest"])
                    }
                    disabled={!preferences.emailEnabled}
                    className="w-full"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily summary</option>
                    <option value="weekly">Weekly summary</option>
                    <option value="off">Off</option>
                  </Select>
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-border/60" />

            {/* Quiet Hours */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Moon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-foreground">Quiet Hours</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <Label htmlFor="quiet-hours" className="text-sm font-medium cursor-pointer block">
                      Enable Do Not Disturb
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Silence notifications during set hours
                    </p>
                  </div>
                  <Switch
                    id="quiet-hours"
                    checked={preferences.quietHoursEnabled}
                    onCheckedChange={(checked) => updatePreference("quietHoursEnabled", checked)}
                  />
                </div>
                {preferences.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-3 px-3">
                    <div>
                      <Label htmlFor="quiet-start" className="text-xs text-muted-foreground mb-1 block">
                        Start time
                      </Label>
                      <input
                        type="time"
                        id="quiet-start"
                        value={preferences.quietHoursStart}
                        onChange={(e) => updatePreference("quietHoursStart", e.target.value)}
                        className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiet-end" className="text-xs text-muted-foreground mb-1 block">
                        End time
                      </Label>
                      <input
                        type="time"
                        id="quiet-end"
                        value={preferences.quietHoursEnd}
                        onChange={(e) => updatePreference("quietHoursEnd", e.target.value)}
                        className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-border/60" />

            {/* Display Options */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Layout className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-foreground">Display Options</h3>
              </div>
              <div className="space-y-4">
                <div className="px-3">
                  <Label htmlFor="display-mode" className="text-sm font-medium mb-2 block">
                    View mode
                  </Label>
                  <Select
                    id="display-mode"
                    value={preferences.displayMode}
                    onChange={(e) =>
                      updatePreference("displayMode", e.target.value as NotificationPreferences["displayMode"])
                    }
                    className="w-full"
                  >
                    <option value="expanded">Expanded</option>
                    <option value="compact">Compact</option>
                  </Select>
                </div>
                <div className="px-3">
                  <Label htmlFor="group-by" className="text-sm font-medium mb-2 block">
                    Group notifications by
                  </Label>
                  <Select
                    id="group-by"
                    value={preferences.groupBy}
                    onChange={(e) =>
                      updatePreference("groupBy", e.target.value as NotificationPreferences["groupBy"])
                    }
                    className="w-full"
                  >
                    <option value="date">Date</option>
                    <option value="category">Category</option>
                  </Select>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Label htmlFor="show-read" className="text-sm font-medium cursor-pointer">
                    Show read notifications
                  </Label>
                  <Switch
                    id="show-read"
                    checked={preferences.showReadNotifications}
                    onCheckedChange={(checked) => updatePreference("showReadNotifications", checked)}
                  />
                </div>
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-border/60" />

            {/* Auto-Archive */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Archive className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-foreground">Auto-Archive</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <Label htmlFor="auto-archive" className="text-sm font-medium cursor-pointer block">
                      Enable auto-archive
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Automatically archive read notifications
                    </p>
                  </div>
                  <Switch
                    id="auto-archive"
                    checked={preferences.autoArchiveEnabled}
                    onCheckedChange={(checked) => updatePreference("autoArchiveEnabled", checked)}
                  />
                </div>
                {preferences.autoArchiveEnabled && (
                  <div className="px-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Archive after</Label>
                      <span className="text-sm text-muted-foreground">
                        {preferences.autoArchiveDays} days
                      </span>
                    </div>
                    <Slider
                      value={[preferences.autoArchiveDays]}
                      onValueChange={([value]) => updatePreference("autoArchiveDays", value)}
                      min={7}
                      max={90}
                      step={7}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>7 days</span>
                      <span>90 days</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-border/60" />

            {/* Sound & Browser */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Volume2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-foreground">Sound & Browser</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <Label htmlFor="sound" className="text-sm font-medium cursor-pointer block">
                      Notification sounds
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Play a sound for new notifications
                    </p>
                  </div>
                  <Switch
                    id="sound"
                    checked={preferences.soundEnabled}
                    onCheckedChange={(checked) => updatePreference("soundEnabled", checked)}
                  />
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <Label htmlFor="browser" className="text-sm font-medium cursor-pointer block">
                      Browser notifications
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Show desktop notifications
                    </p>
                  </div>
                  <Switch
                    id="browser"
                    checked={preferences.browserNotificationsEnabled}
                    onCheckedChange={(checked) => updatePreference("browserNotificationsEnabled", checked)}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9"
              onClick={handleReset}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
              Reset to defaults
            </Button>
            <Button
              size="sm"
              className="flex-1 h-9"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

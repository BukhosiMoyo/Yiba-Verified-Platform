"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Sun, Moon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type EditCVToolbarProps = {
  saveStatus: "idle" | "saving" | "saved";
  onManualSave?: () => void;
  previewDark: boolean;
  onPreviewThemeToggle: () => void;
  publicProfileId?: string | null;
  learnerId?: string;
  publicProfileEnabled?: boolean;
  className?: string;
};

export function EditCVToolbar({
  saveStatus,
  onManualSave,
  previewDark,
  onPreviewThemeToggle,
  publicProfileId,
  learnerId,
  publicProfileEnabled,
  className,
}: EditCVToolbarProps) {
  const [publicPreviewUrl, setPublicPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.location?.origin ||
      !publicProfileEnabled ||
      !(publicProfileId || learnerId)
    )
      return;
    setPublicPreviewUrl(`${window.location.origin}/p/${publicProfileId || learnerId}`);
  }, [publicProfileEnabled, publicProfileId, learnerId]);

  return (
    <TooltipProvider delayDuration={300}>
      <header
        className={cn(
          "sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm md:px-6",
          className
        )}
      >
        <Link
          href="/student/profile"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to Profile
        </Link>

        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
              Saving…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" strokeWidth={1.5} />
              Saved
            </span>
          )}
          {saveStatus === "idle" && onManualSave && (
            <Button variant="outline" size="sm" onClick={onManualSave}>
              Save
            </Button>
          )}
          <span className="text-xs text-muted-foreground hidden sm:inline">Autosave on</span>
          {publicPreviewUrl ? (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={publicPreviewUrl} target="_blank" rel="noopener noreferrer" aria-label="Preview as everyone sees">
                <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                Preview
              </a>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled
                    aria-label="Preview as everyone sees"
                  >
                    <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
                    Preview
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Enable public profile to preview how others see it.</TooltipContent>
            </Tooltip>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onPreviewThemeToggle}
            aria-label={previewDark ? "Preview in light mode" : "Preview in dark mode"}
          >
            {previewDark ? (
              <Sun className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.5} />
            )}
          </Button>
        </div>
      </header>
    </TooltipProvider>
  );
}

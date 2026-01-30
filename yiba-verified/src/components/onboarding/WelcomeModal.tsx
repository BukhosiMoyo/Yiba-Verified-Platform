"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, PlayCircle, X, CheckCircle2 } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
  onSkip: () => void;
}

const BULLETS = [
  "Submit readiness faster",
  "Track reviews in real time",
  "Keep evidence organized",
];

export function WelcomeModal({
  open,
  onOpenChange,
  onStartTour,
  onSkip,
}: WelcomeModalProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  const handleStartTour = () => {
    onStartTour();
    handleClose();
  };

  const handleSkip = () => {
    onSkip();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/30 backdrop-blur-[6px] dark:bg-black/60 dark:backdrop-blur-[8px]"
        className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border border-border/80 bg-card shadow-xl dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] text-center"
      >
        {/* Top accent bar */}
        <div
          className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-primary/80 to-primary/40 flex-shrink-0"
          aria-hidden
        />

        <div className="px-4 pt-6 pb-2 sm:px-8 sm:pt-8 sm:pb-3">
          <DialogHeader className="relative z-10 text-center items-center space-y-4">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="rounded-full p-5 bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 ring-2 ring-primary/20 shadow-sm dark:shadow-md">
                <Sparkles
                  className="h-10 w-10 text-primary"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </div>
            </div>

            <DialogTitle className="text-2xl font-semibold text-foreground">
              Welcome to Yiba Verified
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed max-w-[320px] mx-auto">
              Get started with a quick tour, or skip and explore on your own.
            </DialogDescription>
          </DialogHeader>

          {/* Static bullets */}
          <ul className="relative z-10 mt-6 space-y-2 text-left max-w-[280px] mx-auto">
            {BULLETS.map((text) => (
              <li
                key={text}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-primary/70"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="relative z-10 px-4 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col items-center gap-1.5 sm:flex-1">
              <Button
                onClick={handleStartTour}
                className="w-full sm:w-auto sm:min-w-[160px] h-11 font-semibold gap-2 shadow-sm hover:shadow-md transition-all duration-200 btn-primary-premium"
              >
                <PlayCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
                Show me around
              </Button>
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground border border-border"
                aria-hidden
              >
                Coming soon
              </span>
            </div>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1 h-11 font-medium gap-2 border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
            >
              <X className="h-4 w-4" strokeWidth={2} aria-hidden />
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { Sparkles, PlayCircle, X } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour: () => void;
  onSkip: () => void;
}

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
      <DialogContent className="welcome-modal-pattern sm:max-w-[420px] rounded-2xl border border-gray-200/70 bg-sky-50/60 p-8 pb-7 text-center shadow-xl !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2">
        <DialogHeader className="relative z-10 text-center space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full p-5 bg-gradient-to-br from-blue-50 to-sky-100/90 ring-2 ring-blue-100/80">
              <Sparkles className="h-10 w-10 text-blue-600" strokeWidth={1.5} />
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-gray-900">
            Welcome to Yiba Verified
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 leading-relaxed max-w-[320px] mx-auto">
            We're excited to have you here! Get started with a quick tour of the platform.
          </DialogDescription>
        </DialogHeader>

        {/* Actions */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            onClick={handleStartTour}
            className="flex-1 h-11 font-semibold gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <PlayCircle className="h-4 w-4" strokeWidth={2} />
            Show me around
          </Button>
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 h-11 font-medium gap-2 border-gray-300 bg-white/80 hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={2} />
            Skip the tour
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

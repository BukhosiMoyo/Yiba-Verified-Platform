"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface OnboardingNavigationProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLoading?: boolean;
  nextLabel?: string;
  showSkip?: boolean;
}

export function OnboardingNavigation({
  onNext,
  onBack,
  onSkip,
  canGoBack,
  canGoNext,
  isLoading = false,
  nextLabel = "Next",
  showSkip = false,
}: OnboardingNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
      <div>
        {canGoBack && (
          <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
            Back
          </Button>
        )}
      </div>
      <div className="flex gap-3">
        {showSkip && onSkip && (
          <Button type="button" variant="ghost" onClick={onSkip} disabled={isLoading}>
            Skip for now
          </Button>
        )}
        <Button type="button" onClick={onNext} disabled={!canGoNext || isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

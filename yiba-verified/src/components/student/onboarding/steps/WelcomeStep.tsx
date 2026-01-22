"use client";

import { Button } from "@/components/ui/button";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { Sparkles } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <OnboardingStepWrapper
      title="Welcome to Yiba Verified"
      description="Let's get you set up. This will only take a few minutes."
    >
      <div className="text-center py-8">
        <div className="flex justify-center mb-6">
          <div className="rounded-full p-6 bg-gradient-to-br from-violet-50 to-violet-100 ring-2 ring-violet-200">
            <Sparkles className="h-12 w-12 text-violet-600" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-4 max-w-md mx-auto">
          <p className="text-muted-foreground leading-relaxed">
            We need to collect some information to complete your profile. This information is required for compliance and verification purposes.
          </p>
          <p className="text-sm text-muted-foreground">
            Don't worry - you can save your progress and come back later if needed.
          </p>
        </div>
        <div className="mt-8">
          <Button onClick={onNext} size="lg" className="min-w-[200px]">
            Get Started
          </Button>
        </div>
      </div>
    </OnboardingStepWrapper>
  );
}

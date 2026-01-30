"use client";

import { Button } from "@/components/ui/button";
import { InstitutionOnboardingStepWrapper } from "../InstitutionOnboardingStepWrapper";
import { Sparkles } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <InstitutionOnboardingStepWrapper
      title="Welcome to Yiba Verified"
      description="Let's get your institution set up. This will only take a few minutes."
    >
      <div className="text-center py-8">
        <div className="flex justify-center mb-6">
          <div className="rounded-full p-6 bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-border">
            <Sparkles className="h-12 w-12 text-primary" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-4 max-w-md mx-auto">
          <p className="text-muted-foreground leading-relaxed">
            We need to collect your institution details for compliance and verification. You can add
            multiple branches and invite staff along the way.
          </p>
          <p className="text-sm text-muted-foreground">
            Each step is short — you can complete onboarding in one go.
          </p>
        </div>
        <div className="mt-8">
          <Button onClick={onNext} size="lg" className="min-w-[200px]">
            Get Started
          </Button>
        </div>
      </div>
    </InstitutionOnboardingStepWrapper>
  );
}

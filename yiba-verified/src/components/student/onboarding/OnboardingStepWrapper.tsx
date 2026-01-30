"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface OnboardingStepWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function OnboardingStepWrapper({ title, description, children }: OnboardingStepWrapperProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{title}</h2>
        {description && <p className="text-sm sm:text-base text-muted-foreground">{description}</p>}
      </div>
      <Card className="border-border">
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">{children}</CardContent>
      </Card>
    </div>
  );
}

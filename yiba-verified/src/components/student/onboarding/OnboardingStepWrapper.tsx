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
      <Card className="!shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-gray-200/50 !bg-white">
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">{children}</CardContent>
      </Card>
    </div>
  );
}

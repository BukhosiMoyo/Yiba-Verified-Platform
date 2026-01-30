"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface InstitutionOnboardingStepWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  errorSummary?: string;
}

export function InstitutionOnboardingStepWrapper({
  title,
  description,
  children,
  errorSummary,
}: InstitutionOnboardingStepWrapperProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{title}</h2>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
        )}
        {errorSummary && (
          <p className="text-sm text-destructive mt-2 font-medium" role="alert">
            {errorSummary}
          </p>
        )}
      </div>
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">{children}</CardContent>
      </Card>
    </div>
  );
}

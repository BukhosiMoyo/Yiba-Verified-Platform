"use client";

import type { ComponentType } from "react";
import { Check, Sparkles, User, MapPin, Users, Info, ShieldCheck, GraduationCap, Briefcase, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS: Record<number, string> = {
  1: "Welcome",
  2: "Personal Info",
  3: "Address",
  4: "Next of Kin",
  5: "Additional Info",
  6: "POPIA Consent",
  7: "Qualifications",
  8: "Prior Learning",
  9: "Review",
};

const STEP_ICONS: Record<number, ComponentType<{ className?: string }>> = {
  1: Sparkles,
  2: User,
  3: MapPin,
  4: Users,
  5: Info,
  6: ShieldCheck,
  7: GraduationCap,
  8: Briefcase,
  9: ClipboardList,
};

export function OnboardingProgressBar({ currentStep, totalSteps }: OnboardingProgressBarProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <>
      {/* Mobile/Tablet: Horizontal Top Bar */}
      <div className="lg:hidden w-full mb-6">
        <div className="relative bg-card border-b border-border p-4">
          <div className="relative flex items-center w-full" style={{ gap: '0.25rem' }}>
            {steps.map((step, index) => {
              const isCompleted = step < currentStep;
              const isCurrent = step === currentStep;
              const isPending = step > currentStep;
              const isLast = step === totalSteps;

              return (
                <div key={step} className="flex items-center flex-1 relative" style={{ minWidth: 0 }}>
                  {/* Step Indicator Box - centered */}
                  <div className="flex flex-col items-center justify-center w-full relative z-10">
                    <div
                      className={cn(
                        "w-7 h-7 rounded flex items-center justify-center text-xs font-semibold transition-all duration-300 flex-shrink-0 border-2 mx-auto",
                        isCompleted && "bg-primary text-primary-foreground border-primary shadow-sm",
                        isCurrent && "bg-primary text-primary-foreground border-primary shadow-md scale-110",
                        isPending && "bg-muted text-muted-foreground border-border"
                      )}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      ) : (
                        <span className="font-semibold">{step}</span>
                      )}
                    </div>
                  </div>

                  {/* Connector Line - positioned after the box */}
                  {!isLast && (
                    <div
                      className={cn(
                        "absolute left-full top-1/2 h-0.5 -translate-y-1/2 transition-all duration-300",
                        "w-full",
                        isCompleted ? "bg-primary" : "bg-muted"
                      )}
                      style={{
                        width: 'calc(100% - 0.875rem)',
                        left: 'calc(50% + 0.4375rem)',
                        transform: 'translateY(-50%)'
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop: Vertical Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 h-screen sticky top-0">
        <div className="relative h-full bg-card border-r border-border">
          <div className="relative h-full flex flex-col py-6 px-5 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Progress
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Step {currentStep} of {totalSteps}
              </p>
            </div>

            <nav className="flex-1 space-y-0.5" aria-label="Onboarding progress">
              {steps.map((step) => {
                const isCompleted = step < currentStep;
                const isCurrent = step === currentStep;
                const isPending = step > currentStep;
                const StepIcon = STEP_ICONS[step];

                return (
                  <div
                    key={step}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-3 transition-all duration-200 rounded-lg",
                      isCurrent && "bg-primary/10 dark:bg-primary/15"
                    )}
                  >
                    {/* Connector Line (vertical) */}
                    {step < totalSteps && (
                      <div
                        className={cn(
                          "absolute left-[22px] top-11 w-0.5 h-8 transition-all duration-300",
                          isCompleted ? "bg-primary" : "bg-muted"
                        )}
                        aria-hidden="true"
                      />
                    )}

                    {/* Step Indicator */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded flex items-center justify-center text-sm font-semibold transition-all duration-300 flex-shrink-0 relative z-10 border-2",
                        isCompleted && "bg-primary text-primary-foreground border-primary shadow-sm",
                        isCurrent && "bg-primary text-primary-foreground border-primary shadow-md",
                        isPending && "bg-muted text-muted-foreground border-border"
                      )}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      ) : (
                        <span className="font-semibold">{step}</span>
                      )}
                    </div>

                    {/* Step Label + optional icon */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {StepIcon && (
                        <StepIcon className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isCurrent && "text-primary",
                          isPending && "text-muted-foreground",
                          isCompleted && "text-muted-foreground"
                        )} />
                      )}
                      <div className="min-w-0">
                        <div
                          className={cn(
                            "text-sm font-medium transition-colors duration-300",
                            isCurrent && "text-primary font-semibold",
                            isPending && "text-muted-foreground",
                            isCompleted && "text-foreground"
                          )}
                        >
                          {STEP_LABELS[step] || `Step ${step}`}
                        </div>
                        {isCurrent && (
                          <div className="text-xs text-primary mt-0.5 font-medium">
                            Current step
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Progress indicator */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Progress</span>
                <span className="text-xs font-semibold text-primary">
                  {Math.round((currentStep / totalSteps) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={currentStep}
                  aria-valuemin={1}
                  aria-valuemax={totalSteps}
                  aria-label={`Onboarding progress: ${currentStep} of ${totalSteps} steps completed`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

"use client";

import { Check } from "lucide-react";
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

export function OnboardingProgressBar({ currentStep, totalSteps }: OnboardingProgressBarProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <>
      {/* Mobile/Tablet: Horizontal Top Bar */}
      <div className="lg:hidden w-full mb-6">
        <div className="relative bg-white border-b border-gray-200 p-4">
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
                        isCompleted && "bg-blue-600 text-white border-blue-600 shadow-sm",
                        isCurrent && "bg-blue-600 text-white border-blue-600 shadow-md scale-110",
                        isPending && "bg-white text-gray-400 border-gray-300"
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
                        isCompleted ? "bg-blue-600" : "bg-gray-200"
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
        <div className="relative h-full bg-white border-r border-gray-200">
          <div className="relative h-full flex flex-col py-6 px-5 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Progress
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Step {currentStep} of {totalSteps}
              </p>
            </div>

            <nav className="flex-1 space-y-0.5" aria-label="Onboarding progress">
              {steps.map((step) => {
                const isCompleted = step < currentStep;
                const isCurrent = step === currentStep;
                const isPending = step > currentStep;

                return (
                  <div
                    key={step}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-3 transition-all duration-200 rounded-lg",
                      isCurrent && "bg-blue-50"
                    )}
                  >
                    {/* Connector Line (vertical) */}
                    {step < totalSteps && (
                      <div
                        className={cn(
                          "absolute left-[22px] top-11 w-0.5 h-8 transition-all duration-300",
                          isCompleted ? "bg-blue-600" : "bg-gray-200"
                        )}
                        aria-hidden="true"
                      />
                    )}

                    {/* Step Indicator */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded flex items-center justify-center text-sm font-semibold transition-all duration-300 flex-shrink-0 relative z-10 border-2",
                        isCompleted && "bg-blue-600 text-white border-blue-600 shadow-sm",
                        isCurrent && "bg-blue-600 text-white border-blue-600 shadow-md",
                        isPending && "bg-white text-gray-400 border-gray-300"
                      )}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      ) : (
                        <span className="font-semibold">{step}</span>
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-sm font-medium transition-colors duration-300",
                          isCurrent && "text-blue-700 font-semibold",
                          isPending && "text-gray-400",
                          isCompleted && "text-gray-700"
                        )}
                      >
                        {STEP_LABELS[step] || `Step ${step}`}
                      </div>
                      {isCurrent && (
                        <div className="text-xs text-blue-600 mt-0.5 font-medium">
                          Current step
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Progress indicator */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Progress</span>
                <span className="text-xs font-semibold text-blue-700">
                  {Math.round((currentStep / totalSteps) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
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

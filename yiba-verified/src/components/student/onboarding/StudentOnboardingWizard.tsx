"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OnboardingProgressBar } from "./OnboardingProgressBar";
import { WelcomeStep } from "./steps/WelcomeStep";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { AddressStep } from "./steps/AddressStep";
import { NextOfKinStep } from "./steps/NextOfKinStep";
import { AdditionalInfoStep } from "./steps/AdditionalInfoStep";
import { POPIAConsentStep } from "./steps/POPIAConsentStep";
import { PastQualificationsStep } from "./steps/PastQualificationsStep";
import { PriorLearningStep } from "./steps/PriorLearningStep";
import { ReviewStep } from "./steps/ReviewStep";

const TOTAL_STEPS = 9;

interface OnboardingData {
  personalInfo?: any;
  addressInfo?: any;
  nextOfKinInfo?: any;
  additionalInfo?: any;
  popiaConsent?: boolean;
  pastQualifications?: any[];
  priorLearning?: any[];
}

export function StudentOnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [data, setData] = useState<OnboardingData>({});
  const [lastSavedStep, setLastSavedStep] = useState<number>(0);

  // Load existing progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch("/api/student/onboarding/resume");
        const result = await response.json();

        if (response.ok && result.data) {
          const savedStep = result.data.currentStep || 1;
          setCurrentStep(savedStep);
          setLastSavedStep(savedStep);
          if (result.data.progress) {
            setData({
              personalInfo: result.data.progress.personalInfo,
              addressInfo: result.data.progress.addressInfo,
              nextOfKinInfo: result.data.progress.nextOfKinInfo,
              additionalInfo: result.data.progress.additionalInfo,
              popiaConsent: result.data.progress.popiaConsent,
              pastQualifications: result.data.progress.pastQualifications,
              priorLearning: result.data.progress.priorLearning,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load progress:", error);
        toast.error("Failed to load your progress");
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, []);

  const saveStep = async (step: number, stepData: any, silent = false, updateCurrentStep = false) => {
    try {
      if (!silent) {
        setIsSaving(true);
      }
      const response = await fetch("/api/student/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data: stepData, updateCurrentStep }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save progress");
      }

      // Update local data state
      switch (step) {
        case 2:
          setData((prev) => ({ ...prev, personalInfo: stepData }));
          break;
        case 3:
          setData((prev) => ({ ...prev, addressInfo: stepData }));
          break;
        case 4:
          setData((prev) => ({ ...prev, nextOfKinInfo: stepData }));
          break;
        case 5:
          setData((prev) => ({ ...prev, additionalInfo: stepData }));
          break;
        case 6:
          setData((prev) => ({ ...prev, popiaConsent: stepData.consent }));
          break;
        case 7:
          setData((prev) => ({ ...prev, pastQualifications: stepData.qualifications }));
          break;
        case 8:
          setData((prev) => ({ ...prev, priorLearning: stepData.learning }));
          break;
      }

      // Update saved step to current step for progress tracking
      setLastSavedStep(step);

      return true;
    } catch (error) {
      console.error("Save error:", error);
      if (!silent) {
        toast.error(error instanceof Error ? error.message : "Failed to save progress");
      }
      return false;
    } finally {
      if (!silent) {
        setIsSaving(false);
      }
    }
  };

  // Auto-save with debouncing
  const autoSaveTimeouts = useRef<Record<number, NodeJS.Timeout>>({});

  const autoSave = (step: number, stepData: any) => {
    // Clear existing timeout for this step
    if (autoSaveTimeouts.current[step]) {
      clearTimeout(autoSaveTimeouts.current[step]);
    }

    // Set new timeout to save after 1 second of inactivity
    autoSaveTimeouts.current[step] = setTimeout(() => {
      saveStep(step, stepData, true); // Silent save (no loading indicator, no toast)
    }, 1000);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(autoSaveTimeouts.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const handleStepNext = async (step: number, stepData?: any) => {
    // Save step data if provided (steps 2-8)
    if (stepData !== undefined && step >= 2 && step <= 8) {
      const saved = await saveStep(step, stepData);
      if (!saved) return; // Don't advance if save failed
    }

    // Move to next step and save the new current step
    if (step < TOTAL_STEPS) {
      const nextStep = step + 1;
      setCurrentStep(nextStep);
      // Also update the current_step in the backend when moving forward
      if (nextStep > 1) {
        saveStep(nextStep, {}, true, true).catch(() => {
          // Silent fail for auto-save on navigation
        });
      }
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      // Update current_step when going back (so we can resume from here on refresh)
      saveStep(prevStep, {}, true, true).catch(() => {
        // Silent fail for auto-save on navigation
      });
    }
  };

  const handleSkip = async (step: number) => {
    // For optional steps, save empty data and move to next
    if (step === 7) {
      await saveStep(step, { qualifications: [] });
    } else if (step === 8) {
      await saveStep(step, { learning: [] });
    }
    setCurrentStep(step + 1);
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      const response = await fetch("/api/student/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete onboarding");
      }

      toast.success("Onboarding completed successfully!");
      router.push("/student");
      router.refresh();
    } catch (error) {
      console.error("Complete error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to complete onboarding");
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Dot grid background pattern for the main area */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #3b82f6 1.5px, transparent 1.5px)`,
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0",
        }}
        aria-hidden="true"
      />
      
      <div className="flex flex-col lg:flex-row relative">
        {/* Progress Bar - Show for steps 2-9 */}
        {currentStep > 1 && (
          <OnboardingProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        )}

        {/* Step Content */}
        <div className="flex-1 min-w-0 py-6 sm:py-8 px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto w-full">
          {currentStep === 1 && <WelcomeStep onNext={() => handleStepNext(1)} />}
          {currentStep === 2 && (
            <PersonalInfoStep
              initialData={data.personalInfo}
              onNext={(stepData) => handleStepNext(2, stepData)}
              onBack={handleStepBack}
              onAutoSave={(stepData) => autoSave(2, stepData)}
            />
          )}
          {currentStep === 3 && (
            <AddressStep
              initialData={data.addressInfo}
              onNext={(stepData) => handleStepNext(3, stepData)}
              onBack={handleStepBack}
              onAutoSave={(stepData) => autoSave(3, stepData)}
            />
          )}
          {currentStep === 4 && (
            <NextOfKinStep
              initialData={data.nextOfKinInfo}
              onNext={(stepData) => handleStepNext(4, stepData)}
              onBack={handleStepBack}
              onAutoSave={(stepData) => autoSave(4, stepData)}
            />
          )}
          {currentStep === 5 && (
            <AdditionalInfoStep
              initialData={data.additionalInfo}
              onNext={(stepData) => handleStepNext(5, stepData)}
              onBack={handleStepBack}
              onAutoSave={(stepData) => autoSave(5, stepData)}
            />
          )}
          {currentStep === 6 && (
            <POPIAConsentStep
              initialData={{ consent: data.popiaConsent }}
              onNext={(stepData) => handleStepNext(6, stepData)}
              onBack={handleStepBack}
              onAutoSave={(stepData) => autoSave(6, stepData)}
            />
          )}
          {currentStep === 7 && (
            <PastQualificationsStep
              initialData={{ qualifications: data.pastQualifications }}
              onNext={(stepData) => handleStepNext(7, stepData)}
              onBack={handleStepBack}
              onSkip={() => handleSkip(7)}
              onAutoSave={(stepData) => autoSave(7, stepData)}
            />
          )}
          {currentStep === 8 && (
            <PriorLearningStep
              initialData={{ learning: data.priorLearning }}
              onNext={(stepData) => handleStepNext(8, stepData)}
              onBack={handleStepBack}
              onSkip={() => handleSkip(8)}
              onAutoSave={(stepData) => autoSave(8, stepData)}
            />
          )}
          {currentStep === 9 && (
            <ReviewStep
              allData={data}
              onNext={handleComplete}
              onBack={handleStepBack}
              onEditStep={handleEditStep}
            />
          )}
          </div>
        </div>
      </div>

      {/* Loading overlay for completing */}
      {isCompleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
            <p className="mt-4 text-foreground">Completing onboarding...</p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
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

const getDraftKey = (userId: string) => `yv_student_onboarding_draft_${userId}`;

interface OnboardingData {
  personalInfo?: any;
  addressInfo?: any;
  nextOfKinInfo?: any;
  additionalInfo?: any;
  popiaConsent?: boolean;
  pastQualifications?: any[];
  priorLearning?: any[];
}

function mergeStepIntoData(prev: OnboardingData, step: number, stepData: any): OnboardingData {
  switch (step) {
    case 2: return { ...prev, personalInfo: stepData };
    case 3: return { ...prev, addressInfo: stepData };
    case 4: return { ...prev, nextOfKinInfo: stepData };
    case 5: return { ...prev, additionalInfo: stepData };
    case 6: return { ...prev, popiaConsent: stepData?.consent };
    case 7: return { ...prev, pastQualifications: stepData?.qualifications ?? prev.pastQualifications };
    case 8: return { ...prev, priorLearning: stepData?.learning ?? prev.priorLearning };
    default: return prev;
  }
}

export function StudentOnboardingWizard() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [data, setData] = useState<OnboardingData>({});
  const [lastSavedStep, setLastSavedStep] = useState<number>(0);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);
  const dataRef = useRef<OnboardingData>(data);
  const currentStepRef = useRef(currentStep);

  userIdRef.current = session?.user?.userId;
  dataRef.current = data;
  currentStepRef.current = currentStep;

  // Load existing progress on mount; merge server resume + localStorage draft
  useEffect(() => {
    let cancelled = false;
    const loadProgress = async () => {
      try {
        const response = await fetch("/api/student/onboarding/resume");
        const result = await response.json();
        if (cancelled) return;

        let step = result.data?.currentStep ?? 1;
        let mergedData: OnboardingData = result.data?.progress
          ? {
              personalInfo: result.data.progress.personalInfo,
              addressInfo: result.data.progress.addressInfo,
              nextOfKinInfo: result.data.progress.nextOfKinInfo,
              additionalInfo: result.data.progress.additionalInfo,
              popiaConsent: result.data.progress.popiaConsent,
              pastQualifications: result.data.progress.pastQualifications,
              priorLearning: result.data.progress.priorLearning,
            }
          : {};

        const userId = session?.user?.userId;
        if (userId) {
          try {
            const raw = localStorage.getItem(getDraftKey(userId));
            if (raw) {
              const draft = JSON.parse(raw) as { currentStep?: number; data?: OnboardingData };
              if (draft.data && typeof draft.data === "object") {
                mergedData = { ...mergedData, ...draft.data };
              }
              if (typeof draft.currentStep === "number") {
                step = Math.max(step, draft.currentStep);
              }
              toast.info("Draft restored");
            }
          } catch (_) {
            // ignore invalid draft
          }
        }

        setCurrentStep(step);
        setLastSavedStep(step);
        setData(mergedData);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load progress:", error);
          toast.error("Failed to load your progress");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.userId]);

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
      setLastSavedAt(Date.now());

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

  // Auto-save with debouncing (600ms so progress is saved quickly)
  const autoSaveTimeouts = useRef<Record<number, NodeJS.Timeout>>({});
  const lastPendingSaveRef = useRef<{ step: number; stepData: any } | null>(null);

  const flushPendingAutoSave = () => {
    Object.keys(autoSaveTimeouts.current).forEach((key) => {
      clearTimeout(autoSaveTimeouts.current[Number(key)]);
    });
    autoSaveTimeouts.current = {};
    const pending = lastPendingSaveRef.current;
    if (pending && pending.step >= 2 && pending.step <= 8) {
      saveStep(pending.step, pending.stepData, true).catch(() => {});
      lastPendingSaveRef.current = null;
    }
  };

  const autoSave = (step: number, stepData: any) => {
    lastPendingSaveRef.current = { step, stepData };
    if (autoSaveTimeouts.current[step]) {
      clearTimeout(autoSaveTimeouts.current[step]);
    }
    autoSaveTimeouts.current[step] = setTimeout(() => {
      const merged = mergeStepIntoData(dataRef.current, step, stepData);
      const userId = userIdRef.current;
      if (userId) {
        try {
          localStorage.setItem(
            getDraftKey(userId),
            JSON.stringify({ currentStep: currentStepRef.current, data: merged })
          );
        } catch (_) {
          // ignore quota or other errors
        }
      }
      saveStep(step, stepData, true);
      lastPendingSaveRef.current = null;
    }, 600);
  };

  // Clear "Saved" indicator after a few seconds
  useEffect(() => {
    if (lastSavedAt == null) return;
    const t = setTimeout(() => setLastSavedAt(null), 4000);
    return () => clearTimeout(t);
  }, [lastSavedAt]);

  // Flush pending autosave when user leaves tab (refresh, close, switch) so data isn't lost
  useEffect(() => {
    const onLeave = () => {
      if (document.visibilityState !== "hidden") return;
      flushPendingAutoSave();
    };
    document.addEventListener("visibilitychange", onLeave);
    window.addEventListener("pagehide", onLeave);
    return () => {
      document.removeEventListener("visibilitychange", onLeave);
      window.removeEventListener("pagehide", onLeave);
      Object.values(autoSaveTimeouts.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const writeDraft = (step: number, draftData: OnboardingData) => {
    const userId = userIdRef.current;
    if (!userId) return;
    try {
      localStorage.setItem(getDraftKey(userId), JSON.stringify({ currentStep: step, data: draftData }));
    } catch (_) {}
  };

  const handleStepNext = async (step: number, stepData?: any) => {
    // Flush any pending auto-save for this step so we don't lose the latest input
    flushPendingAutoSave();

    // Save step data if provided (steps 2-8)
    if (stepData !== undefined && step >= 2 && step <= 8) {
      const saved = await saveStep(step, stepData);
      if (!saved) return; // Don't advance if save failed
    }

    // Move to next step and save the new current step
    if (step < TOTAL_STEPS) {
      const nextStep = step + 1;
      const mergedData = stepData !== undefined && step >= 2 && step <= 8
        ? mergeStepIntoData(data, step, stepData)
        : data;
      setCurrentStep(nextStep);
      writeDraft(nextStep, mergedData);
      // Update current_step in the backend only (don't overwrite next step's content)
      if (nextStep > 1) {
        saveStep(nextStep, {}, true, true).catch(() => {});
      }
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      // Flush pending auto-save for current step before going back
      flushPendingAutoSave();

      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      writeDraft(prevStep, data);
      saveStep(prevStep, {}, true, true).catch(() => {});
    }
  };

  const handleSkip = async (step: number) => {
    const nextStep = step + 1;
    const mergedData =
      step === 7 ? { ...data, pastQualifications: [] as any[] } : { ...data, priorLearning: [] as any[] };
    if (step === 7) {
      await saveStep(step, { qualifications: [] });
    } else if (step === 8) {
      await saveStep(step, { learning: [] });
    }
    setCurrentStep(nextStep);
    writeDraft(nextStep, mergedData);
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

      await updateSession({ onboarding_completed: true });
      const userId = session?.user?.userId;
      if (userId) {
        try {
          localStorage.removeItem(getDraftKey(userId));
        } catch (_) {}
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
      <div className="min-h-screen flex items-center justify-center relative bg-background">
        <div className="absolute right-4 top-4 z-20 lg:right-6 lg:top-6">
          <ThemeToggle variant="icon-sm" aria-label="Toggle light or dark mode" />
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Theme toggle — top-right on onboarding */}
      <div className="absolute right-4 top-4 z-20 lg:right-6 lg:top-6">
        <ThemeToggle variant="icon-sm" aria-label="Toggle light or dark mode" />
      </div>

      {/* Dot grid background pattern (theme-aware via --pattern-dot in globals.css) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[var(--pattern-opacity)]"
        style={{
          backgroundImage: "radial-gradient(circle, var(--pattern-dot) 1.5px, transparent 1.5px)",
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
          {/* Autosave status indicator */}
          {currentStep >= 2 && currentStep <= 8 && (
            <div className="max-w-3xl mx-auto w-full mb-2 flex justify-end">
              <span className="text-xs text-muted-foreground">
                {isSaving ? "Saving…" : lastSavedAt != null ? "Saved" : ""}
              </span>
            </div>
          )}
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

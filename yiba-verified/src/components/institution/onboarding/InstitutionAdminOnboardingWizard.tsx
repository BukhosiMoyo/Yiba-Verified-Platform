"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { InstitutionOnboardingProgressBar } from "./InstitutionOnboardingProgressBar";
import { WelcomeStep } from "./steps/WelcomeStep";
import { InstitutionBasicsStep } from "./steps/InstitutionBasicsStep";
import { InstitutionAddressStep } from "./steps/InstitutionAddressStep";
import { DeliveryOptionsStep } from "./steps/DeliveryOptionsStep";
import { BranchesStep } from "./steps/BranchesStep";
import { InviteStaffStep } from "./steps/InviteStaffStep";
import { ReviewConfirmStep } from "./steps/ReviewConfirmStep";
import type { InstitutionFormEntry, StaffInviteEntry } from "./types";
import { emptyInstitution } from "./types";

const TOTAL_STEPS = 7;

export function InstitutionAdminOnboardingWizard() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const hasExistingInstitution = !!session?.user?.institutionId;

  const [currentStep, setCurrentStep] = useState(1);
  const [institutions, setInstitutions] = useState<InstitutionFormEntry[]>(() =>
    hasExistingInstitution ? [] : [emptyInstitution()]
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [staffInvites, setStaffInvites] = useState<StaffInviteEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const updateInstitution = (index: number, field: keyof InstitutionFormEntry, value: string) => {
    setInstitutions((prev) =>
      prev.map((inst, i) => (i === index ? { ...inst, [field]: value } : inst))
    );
  };

  const addInstitution = () => {
    setInstitutions((prev) => [...prev, emptyInstitution()]);
  };

  const removeInstitution = (index: number) => {
    setInstitutions((prev) => prev.filter((_, i) => i !== index));
  };

  const addStaffInvite = () => {
    setStaffInvites((prev) => [...prev, { name: "", email: "", role: "INSTITUTION_STAFF" }]);
  };

  const removeStaffInvite = (index: number) => {
    setStaffInvites((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStaffInvite = (index: number, field: keyof StaffInviteEntry, value: string) => {
    setStaffInvites((prev) =>
      prev.map((inv, i) => (i === index ? { ...inv, [field]: value } : inv))
    );
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      setSubmitError(undefined);
    }
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
    setSubmitError(undefined);
  };

  const handleComplete = async () => {
    if (!acknowledged) {
      setSubmitError("Please acknowledge the responsibilities to complete onboarding.");
      return;
    }

    const validInstitutionsCheck = institutions.filter((inst) => inst.legal_name.trim());
    if (!hasExistingInstitution && validInstitutionsCheck.length === 0) {
      setSubmitError("Add at least one institution to continue.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      const validInstitutions = institutions.filter((inst) => inst.legal_name.trim());
      const payload = {
        acknowledged: true,
        institutions:
          validInstitutions.length > 0
            ? validInstitutions.map((inst) => ({
                legal_name: inst.legal_name.trim(),
                trading_name: inst.trading_name.trim() || null,
                institution_type: inst.institution_type,
                registration_number: inst.registration_number.trim(),
                branch_code: inst.branch_code.trim() || null,
                physical_address: inst.physical_address.trim(),
                postal_address: inst.postal_address.trim() || null,
                province: inst.province.trim(),
                contact_person_name: inst.contact_person_name.trim() || null,
                contact_email: inst.contact_email.trim() || null,
                contact_number: inst.contact_number.trim() || null,
                offers_workplace_based_learning:
                  inst.offers_workplace_based_learning === "yes" ? true : inst.offers_workplace_based_learning === "no" ? false : null,
                offers_web_based_learning:
                  inst.offers_web_based_learning === "yes" ? true : inst.offers_web_based_learning === "no" ? false : null,
              }))
            : [],
      };

      const response = await fetch("/api/institution/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete onboarding");
      }

      await updateSession({
        onboarding_completed: true,
        ...(result.firstInstitutionId ? { institutionId: result.firstInstitutionId } : {}),
      });

      const invitesToSend = staffInvites.filter((i) => i.email.trim());
      if (invitesToSend.length > 0) {
        for (const inv of invitesToSend) {
          try {
            const inviteRes = await fetch("/api/invites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: inv.email.trim(),
                role: inv.role || "INSTITUTION_STAFF",
              }),
            });
            const inviteData = await inviteRes.json();
            if (!inviteRes.ok) {
              toast.error(`Invite to ${inv.email} failed: ${inviteData.error || "Unknown error"}`);
            }
          } catch (err) {
            toast.error(`Failed to send invite to ${inv.email}`);
          }
        }
      }

      toast.success("Onboarding completed successfully!");
      router.push("/institution");
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to complete onboarding";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstInstitution = institutions[0];
  const branches = institutions.slice(1); // step 5: index 1+ are branches

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute right-4 top-4 z-20 lg:right-6 lg:top-6">
        <ThemeToggle variant="icon-sm" aria-label="Toggle light or dark mode" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0",
        }}
        aria-hidden="true"
      />

      <div className="flex flex-col lg:flex-row relative">
        {currentStep > 1 && (
          <InstitutionOnboardingProgressBar
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
          />
        )}

        <div className="flex-1 min-w-0 py-6 sm:py-8 px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto w-full">
            {currentStep === 1 && (
              <WelcomeStep onNext={() => setCurrentStep(2)} />
            )}
            {currentStep === 2 && (
              <InstitutionBasicsStep
                institution={firstInstitution ?? emptyInstitution()}
                onUpdate={(field, value) => updateInstitution(0, field, value)}
                onNext={() => setCurrentStep(3)}
                onBack={handleStepBack}
                hasExistingInstitution={!!hasExistingInstitution}
              />
            )}
            {currentStep === 3 && firstInstitution && (
              <InstitutionAddressStep
                institution={firstInstitution}
                onUpdate={(field, value) => updateInstitution(0, field, value)}
                onNext={() => setCurrentStep(4)}
                onBack={handleStepBack}
                hasExistingInstitution={!!hasExistingInstitution}
              />
            )}
            {currentStep === 4 && firstInstitution && (
              <DeliveryOptionsStep
                institution={firstInstitution}
                onUpdate={(field, value) => updateInstitution(0, field, value)}
                onNext={() => setCurrentStep(5)}
                onBack={handleStepBack}
                hasExistingInstitution={!!hasExistingInstitution}
              />
            )}
            {currentStep === 5 && (
              <BranchesStep
                branches={branches}
                onUpdate={(branchIndex, field, value) =>
                  updateInstitution(branchIndex + 1, field, value)
                }
                onAddBranch={addInstitution}
                onRemoveBranch={(i) => removeInstitution(i + 1)}
                onNext={() => setCurrentStep(6)}
                onBack={handleStepBack}
                hasExistingInstitution={!!hasExistingInstitution}
              />
            )}
            {currentStep === 6 && (
              <InviteStaffStep
                staffInvites={staffInvites}
                onUpdate={updateStaffInvite}
                onAdd={addStaffInvite}
                onRemove={removeStaffInvite}
                onNext={() => setCurrentStep(7)}
                onBack={handleStepBack}
                onSkip={() => setCurrentStep(7)}
              />
            )}
            {currentStep === 7 && (
              <ReviewConfirmStep
                institutions={institutions}
                staffInvites={staffInvites}
                acknowledged={acknowledged}
                onAcknowledgedChange={setAcknowledged}
                onBack={handleStepBack}
                onSubmit={handleComplete}
                onEditStep={handleEditStep}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            )}
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 text-center border border-border">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-foreground">Completing onboarding...</p>
          </div>
        </div>
      )}
    </div>
  );
}

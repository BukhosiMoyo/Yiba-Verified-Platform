"use client";

import { InstitutionOnboardingStepWrapper } from "../InstitutionOnboardingStepWrapper";
import { OnboardingNavigation } from "@/components/student/onboarding/OnboardingNavigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import type { InstitutionFormEntry } from "../types";

interface DeliveryOptionsStepProps {
  institution: InstitutionFormEntry;
  onUpdate: (field: keyof InstitutionFormEntry, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  hasExistingInstitution?: boolean;
}

export function DeliveryOptionsStep({
  institution,
  onUpdate,
  onNext,
  onBack,
  hasExistingInstitution = false,
}: DeliveryOptionsStepProps) {
  const offersWbl = institution.offers_workplace_based_learning === "yes";
  const offersWeb = institution.offers_web_based_learning === "yes";

  return (
    <InstitutionOnboardingStepWrapper
      title="Delivery options"
      description="Tell us how you deliver training. This helps QCTO and learners understand your offering."
      errorSummary={undefined}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-foreground font-medium">
            Do you offer workplace-based learning?
          </Label>
          <p className="text-xs text-muted-foreground">
            Training delivered at the workplace (e.g. apprenticeships, work placements).
          </p>
          <RadioGroup
            value={institution.offers_workplace_based_learning || ""}
            onValueChange={(v) => onUpdate("offers_workplace_based_learning", v)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioItem value="yes" id="wbl_yes" />
              <Label htmlFor="wbl_yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioItem value="no" id="wbl_no" />
              <Label htmlFor="wbl_no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
          {offersWbl && (
            <div className="mt-3 space-y-2">
              <Label htmlFor="wbl_summary_0" className="text-muted-foreground text-sm">
                Brief description (optional)
              </Label>
              <Textarea
                id="wbl_summary_0"
                value={institution.wbl_summary || ""}
                onChange={(e) => onUpdate("wbl_summary", e.target.value)}
                placeholder="e.g. We partner with workplaces for practical components..."
                rows={2}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-medium">
            Do you offer web-based (online) learning?
          </Label>
          <p className="text-xs text-muted-foreground">
            Courses or modules delivered online (e.g. LMS, e-learning).
          </p>
          <RadioGroup
            value={institution.offers_web_based_learning || ""}
            onValueChange={(v) => onUpdate("offers_web_based_learning", v)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioItem value="yes" id="web_yes" />
              <Label htmlFor="web_yes" className="font-normal cursor-pointer">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioItem value="no" id="web_no" />
              <Label htmlFor="web_no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
          {offersWeb && (
            <div className="mt-3 space-y-2">
              <Label htmlFor="web_based_lms_name_0" className="text-muted-foreground text-sm">
                LMS or platform name (optional)
              </Label>
              <Input
                id="web_based_lms_name_0"
                value={institution.web_based_lms_name || ""}
                onChange={(e) => onUpdate("web_based_lms_name", e.target.value)}
                placeholder="e.g. Tutor LMS, Moodle"
              />
            </div>
          )}
        </div>
      </div>
      <OnboardingNavigation
        onNext={onNext}
        onBack={onBack}
        canGoBack={true}
        canGoNext={true}
      />
    </InstitutionOnboardingStepWrapper>
  );
}

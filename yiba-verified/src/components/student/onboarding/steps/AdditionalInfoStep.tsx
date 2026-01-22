"use client";

import { useState, useEffect } from "react";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { OnboardingNavigation } from "../OnboardingNavigation";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { DISABILITY_STATUS_OPTIONS, ETHNICITY_OPTIONS } from "@/lib/onboarding-constants";

interface AdditionalInfoStepProps {
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onAutoSave?: (data: any) => void;
}

export function AdditionalInfoStep({ initialData, onNext, onBack, onAutoSave }: AdditionalInfoStepProps) {
  const [disabilityStatus, setDisabilityStatus] = useState(initialData?.disability_status || "");
  const [ethnicity, setEthnicity] = useState(initialData?.ethnicity || "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!disabilityStatus) {
      newErrors.disabilityStatus = "Disability status is required";
    }

    if (!ethnicity) {
      newErrors.ethnicity = "Ethnicity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-save when fields change
  useEffect(() => {
    if (onAutoSave && (disabilityStatus || ethnicity)) {
      onAutoSave({
        disability_status: disabilityStatus,
        ethnicity,
      });
    }
  }, [disabilityStatus, ethnicity, onAutoSave]);

  const handleNext = () => {
    if (validate()) {
      onNext({
        disability_status: disabilityStatus,
        ethnicity,
      });
    }
  };

  return (
    <OnboardingStepWrapper
      title="Additional Information"
      description="Please provide the following information. This is required for compliance and reporting."
    >
      <div className="space-y-6">
        {/* Disability Status */}
        <div>
          <Label>
            Do you have a disability? <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={disabilityStatus}
            onValueChange={setDisabilityStatus}
            error={!!errors.disabilityStatus}
          >
            {DISABILITY_STATUS_OPTIONS.map((option) => (
              <RadioItem
                key={option.value}
                value={option.value}
                id={`disability-${option.value}`}
                label={option.label}
              />
            ))}
          </RadioGroup>
          {errors.disabilityStatus && <p className="text-sm text-red-500 mt-1">{errors.disabilityStatus}</p>}
        </div>

        {/* Ethnicity */}
        <div>
          <Label htmlFor="ethnicity">
            Ethnicity <span className="text-red-500">*</span>
          </Label>
          <Select
            id="ethnicity"
            value={ethnicity}
            onChange={(e) => setEthnicity(e.target.value)}
            placeholder="Select ethnicity"
            className={errors.ethnicity ? "border-red-500" : ""}
            aria-invalid={!!errors.ethnicity}
          >
            {ETHNICITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {errors.ethnicity && <p className="text-sm text-red-500 mt-1">{errors.ethnicity}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            This information is collected for compliance and reporting purposes only.
          </p>
        </div>
      </div>

      <OnboardingNavigation
        onNext={handleNext}
        onBack={onBack}
        canGoBack={true}
        canGoNext={true}
      />
    </OnboardingStepWrapper>
  );
}

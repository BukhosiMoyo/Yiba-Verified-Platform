"use client";

import { useState } from "react";
import { InstitutionOnboardingStepWrapper } from "../InstitutionOnboardingStepWrapper";
import { OnboardingNavigation } from "@/components/student/onboarding/OnboardingNavigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InstitutionFormEntry } from "../types";
import { INSTITUTION_TYPES } from "../types";

interface InstitutionBasicsStepProps {
  institution: InstitutionFormEntry;
  onUpdate: (field: keyof InstitutionFormEntry, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  hasExistingInstitution: boolean;
}

export function InstitutionBasicsStep({
  institution,
  onUpdate,
  onNext,
  onBack,
  hasExistingInstitution,
}: InstitutionBasicsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!hasExistingInstitution) {
      if (!institution.legal_name.trim()) newErrors.legal_name = "Legal name is required";
      if (!institution.registration_number.trim())
        newErrors.registration_number = "Registration number is required";
      if (!institution.institution_type) newErrors.institution_type = "Institution type is required";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      setTimeout(() => {
        const el = document.getElementById(firstKey === "legal_name" ? "legal_name_0" : firstKey === "registration_number" ? "registration_number_0" : "institution_type_0");
        (el as HTMLInputElement | null)?.focus?.();
      }, 0);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const isEmployer = institution.institution_type === "EMPLOYER";

  return (
    <InstitutionOnboardingStepWrapper
      title="Institution basics"
      description="Enter your main institution details and primary contact."
      errorSummary={
        Object.keys(errors).length > 0
          ? "Please fix the errors below before continuing."
          : undefined
      }
    >
      <div className="space-y-6">
        {hasExistingInstitution && (
          <p className="text-sm text-muted-foreground">
            You&apos;re already linked to an institution. Add another below or continue to the next
            step.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="legal_name_0">
              {isEmployer ? "Company name" : "Legal name"} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="legal_name_0"
              value={institution.legal_name}
              onChange={(e) => onUpdate("legal_name", e.target.value)}
              placeholder={isEmployer ? "Registered company name" : "Registered legal name"}
              className={errors.legal_name ? "border-destructive" : ""}
              aria-invalid={!!errors.legal_name}
            />
            {errors.legal_name && (
              <p className="text-sm text-destructive mt-1">{errors.legal_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="trading_name_0">Trading name (optional)</Label>
            <Input
              id="trading_name_0"
              value={institution.trading_name}
              onChange={(e) => onUpdate("trading_name", e.target.value)}
              placeholder="Trading as"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="institution_type_0">
              {isEmployer ? "Organisation type" : "Institution type"} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={institution.institution_type}
              onValueChange={(v) => onUpdate("institution_type", v)}
            >
              <SelectTrigger
                id="institution_type_0"
                className={errors.institution_type ? "border-destructive" : ""}
                aria-invalid={!!errors.institution_type}
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.institution_type && (
              <p className="text-sm text-destructive mt-1">{errors.institution_type}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration_number_0">
              Registration number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="registration_number_0"
              value={institution.registration_number}
              onChange={(e) => onUpdate("registration_number", e.target.value)}
              placeholder="e.g. 2021/123456/08"
              className={errors.registration_number ? "border-destructive" : ""}
              aria-invalid={!!errors.registration_number}
            />
            {errors.registration_number && (
              <p className="text-sm text-destructive mt-1">{errors.registration_number}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch_code_0">Branch or location code (optional)</Label>
            <Input
              id="branch_code_0"
              value={institution.branch_code}
              onChange={(e) => onUpdate("branch_code", e.target.value)}
              placeholder="e.g. HQ, CPT-01"
            />
            <p className="text-xs text-muted-foreground">
              Unique code to identify this branch or location.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-foreground font-medium">Primary contact (optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Contact person, email, and phone for this institution.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_person_0">Contact person</Label>
            <Input
              id="contact_person_0"
              value={institution.contact_person_name}
              onChange={(e) => onUpdate("contact_person_name", e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email_0">Contact email</Label>
            <Input
              id="contact_email_0"
              type="email"
              value={institution.contact_email}
              onChange={(e) => onUpdate("contact_email", e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_number_0">Contact number</Label>
            <Input
              id="contact_number_0"
              value={institution.contact_number}
              onChange={(e) => onUpdate("contact_number", e.target.value)}
              placeholder="+27..."
            />
          </div>
        </div>
      </div>
      <OnboardingNavigation
        onNext={handleNext}
        onBack={onBack}
        canGoBack={true}
        canGoNext={true}
      />
    </InstitutionOnboardingStepWrapper>
  );
}

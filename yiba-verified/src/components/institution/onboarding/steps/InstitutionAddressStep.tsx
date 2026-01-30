"use client";

import { useState } from "react";
import { InstitutionOnboardingStepWrapper } from "../InstitutionOnboardingStepWrapper";
import { OnboardingNavigation } from "@/components/student/onboarding/OnboardingNavigation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { PROVINCES } from "@/lib/provinces";
import type { ParsedAddress } from "@/lib/address/parseGooglePlace";
import type { InstitutionFormEntry } from "../types";

interface InstitutionAddressStepProps {
  institution: InstitutionFormEntry;
  onUpdate: (field: keyof InstitutionFormEntry, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  hasExistingInstitution?: boolean;
}

export function InstitutionAddressStep({
  institution,
  onUpdate,
  onNext,
  onBack,
  hasExistingInstitution = false,
}: InstitutionAddressStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    if (hasExistingInstitution && !institution.legal_name.trim()) {
      return true;
    }
    const newErrors: Record<string, string> = {};
    if (!institution.physical_address.trim()) {
      newErrors.physical_address = "Physical address is required";
    }
    if (!institution.province.trim()) {
      newErrors.province = "Province is required";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        const id = newErrors.physical_address ? "physical_address_0" : "province_0";
        const el = document.getElementById(id);
        (el as HTMLInputElement | HTMLSelectElement | null)?.focus?.();
      }, 0);
      return false;
    }
    return true;
  };

  const handleSelect = (parsed: ParsedAddress) => {
    if (parsed.province) onUpdate("province", parsed.province);
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <InstitutionOnboardingStepWrapper
      title="Address & location"
      description="Enter the physical address for this institution. Province is required for compliance."
      errorSummary={
        Object.keys(errors).length > 0
          ? "Please fix the errors below before continuing."
          : undefined
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="physical_address_0">
            Physical address <span className="text-destructive">*</span>
          </Label>
          <AddressAutocomplete
            id="physical_address_0"
            value={institution.physical_address}
            onChange={(v) => onUpdate("physical_address", v)}
            onSelect={handleSelect}
            placeholder="Start typing your address..."
            className={errors.physical_address ? "border-destructive" : ""}
            error={!!errors.physical_address}
            countryRestrictions={["za"]}
          />
          {errors.physical_address && (
            <p className="text-sm text-destructive mt-1">{errors.physical_address}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="postal_address_0">Postal address (optional)</Label>
          <AddressAutocomplete
            id="postal_address_0"
            value={institution.postal_address}
            onChange={(v) => onUpdate("postal_address", v)}
            onSelect={() => {}}
            placeholder="P.O. Box or same as physical"
            countryRestrictions={["za"]}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="province_0">
            Province <span className="text-destructive">*</span>
          </Label>
          <Select
            value={institution.province}
            onValueChange={(v) => onUpdate("province", v)}
          >
            <SelectTrigger
              id="province_0"
              className={errors.province ? "border-destructive" : ""}
              aria-invalid={!!errors.province}
            >
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.province && (
            <p className="text-sm text-destructive mt-1">{errors.province}</p>
          )}
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

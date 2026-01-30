"use client";

import { useState } from "react";
import { InstitutionOnboardingStepWrapper } from "../InstitutionOnboardingStepWrapper";
import { OnboardingNavigation } from "@/components/student/onboarding/OnboardingNavigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { Plus, Trash2 } from "lucide-react";
import { PROVINCES } from "@/lib/provinces";
import type { ParsedAddress } from "@/lib/address/parseGooglePlace";
import type { InstitutionFormEntry } from "../types";
import { INSTITUTION_TYPES } from "../types";

interface BranchesStepProps {
  branches: InstitutionFormEntry[];
  onUpdate: (index: number, field: keyof InstitutionFormEntry, value: string) => void;
  onAddBranch: () => void;
  onRemoveBranch: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  hasExistingInstitution: boolean;
}

export function BranchesStep({
  branches,
  onUpdate,
  onAddBranch,
  onRemoveBranch,
  onNext,
  onBack,
  hasExistingInstitution,
}: BranchesStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    branches.forEach((inst, i) => {
      const idx = i + 1;
      if (!inst.legal_name.trim()) newErrors[`legal_name_${idx}`] = "Legal name is required";
      if (!inst.registration_number.trim())
        newErrors[`registration_number_${idx}`] = "Registration number is required";
      if (!inst.institution_type) newErrors[`institution_type_${idx}`] = "Institution type is required";
      if (!inst.physical_address.trim())
        newErrors[`physical_address_${idx}`] = "Physical address is required";
      if (!inst.province.trim()) newErrors[`province_${idx}`] = "Province is required";
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      if (firstKey) {
        setTimeout(() => {
          const el = document.getElementById(firstKey);
          (el as HTMLInputElement | HTMLSelectElement | null)?.focus?.();
        }, 0);
      }
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <InstitutionOnboardingStepWrapper
      title="Branches / campuses"
      description="Add more branches or locations. You can skip this step and add them later."
      errorSummary={
        Object.keys(errors).length > 0
          ? "Please complete all required fields for each branch before continuing."
          : undefined
      }
    >
      <div className="space-y-6">
        {hasExistingInstitution && (
          <p className="text-sm text-muted-foreground">
            You&apos;re already linked to an institution. Add more branches below or continue.
          </p>
        )}
        {branches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No additional branches added. Click below to add one, or continue to the next step.
            </p>
            <Button type="button" variant="outline" onClick={onAddBranch} className="rounded-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add a branch
            </Button>
          </div>
        ) : (
          branches.map((inst, i) => {
            const globalIndex = i + 1;
            return (
              <div
                key={i}
                className="rounded-lg border border-border bg-muted/20 p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Branch {globalIndex}
                    {inst.branch_code.trim() ? ` (${inst.branch_code})` : ""}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onRemoveBranch(i)}
                    aria-label={`Remove branch ${globalIndex}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`legal_name_${globalIndex}`}>Legal name *</Label>
                    <Input
                      id={`legal_name_${globalIndex}`}
                      value={inst.legal_name}
                      onChange={(e) => onUpdate(i, "legal_name", e.target.value)}
                      placeholder="Registered legal name"
                      className={errors[`legal_name_${globalIndex}`] ? "border-destructive" : ""}
                    />
                    {errors[`legal_name_${globalIndex}`] && (
                      <p className="text-sm text-destructive">{errors[`legal_name_${globalIndex}`]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`trading_name_${globalIndex}`}>Trading name (optional)</Label>
                    <Input
                      id={`trading_name_${globalIndex}`}
                      value={inst.trading_name}
                      onChange={(e) => onUpdate(i, "trading_name", e.target.value)}
                      placeholder="Trading as"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`institution_type_${globalIndex}`}>Institution type *</Label>
                    <Select
                      value={inst.institution_type}
                      onValueChange={(v) => onUpdate(i, "institution_type", v)}
                    >
                      <SelectTrigger
                        id={`institution_type_${globalIndex}`}
                        className={errors[`institution_type_${globalIndex}`] ? "border-destructive" : ""}
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
                    {errors[`institution_type_${globalIndex}`] && (
                      <p className="text-sm text-destructive">{errors[`institution_type_${globalIndex}`]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`registration_number_${globalIndex}`}>Registration number *</Label>
                    <Input
                      id={`registration_number_${globalIndex}`}
                      value={inst.registration_number}
                      onChange={(e) => onUpdate(i, "registration_number", e.target.value)}
                      placeholder="e.g. 2021/123456/08"
                      className={errors[`registration_number_${globalIndex}`] ? "border-destructive" : ""}
                    />
                    {errors[`registration_number_${globalIndex}`] && (
                      <p className="text-sm text-destructive">{errors[`registration_number_${globalIndex}`]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`branch_code_${globalIndex}`}>Branch code (optional)</Label>
                    <Input
                      id={`branch_code_${globalIndex}`}
                      value={inst.branch_code}
                      onChange={(e) => onUpdate(i, "branch_code", e.target.value)}
                      placeholder="e.g. CPT-01"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`physical_address_${globalIndex}`}>Physical address *</Label>
                    <AddressAutocomplete
                      id={`physical_address_${globalIndex}`}
                      value={inst.physical_address}
                      onChange={(v) => onUpdate(i, "physical_address", v)}
                      onSelect={(parsed: ParsedAddress) => {
                        if (parsed.province) onUpdate(i, "province", parsed.province);
                      }}
                      placeholder="Street, city, code"
                      className={errors[`physical_address_${globalIndex}`] ? "border-destructive" : ""}
                      error={!!errors[`physical_address_${globalIndex}`]}
                      countryRestrictions={["za"]}
                    />
                    {errors[`physical_address_${globalIndex}`] && (
                      <p className="text-sm text-destructive">{errors[`physical_address_${globalIndex}`]}</p>
                    )}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor={`postal_address_${globalIndex}`}>Postal address (optional)</Label>
                    <AddressAutocomplete
                      id={`postal_address_${globalIndex}`}
                      value={inst.postal_address}
                      onChange={(v) => onUpdate(i, "postal_address", v)}
                      onSelect={() => {}}
                      placeholder="P.O. Box or same as physical"
                      countryRestrictions={["za"]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`province_${globalIndex}`}>Province *</Label>
                    <Select
                      value={inst.province}
                      onValueChange={(v) => onUpdate(i, "province", v)}
                    >
                      <SelectTrigger
                        id={`province_${globalIndex}`}
                        className={errors[`province_${globalIndex}`] ? "border-destructive" : ""}
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
                    {errors[`province_${globalIndex}`] && (
                      <p className="text-sm text-destructive">{errors[`province_${globalIndex}`]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`contact_person_${globalIndex}`}>Contact person (optional)</Label>
                    <Input
                      id={`contact_person_${globalIndex}`}
                      value={inst.contact_person_name}
                      onChange={(e) => onUpdate(i, "contact_person_name", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`contact_email_${globalIndex}`}>Contact email (optional)</Label>
                    <Input
                      id={`contact_email_${globalIndex}`}
                      type="email"
                      value={inst.contact_email}
                      onChange={(e) => onUpdate(i, "contact_email", e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`contact_number_${globalIndex}`}>Contact number (optional)</Label>
                    <Input
                      id={`contact_number_${globalIndex}`}
                      value={inst.contact_number}
                      onChange={(e) => onUpdate(i, "contact_number", e.target.value)}
                      placeholder="+27..."
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
        {branches.length > 0 && (
          <Button type="button" variant="outline" onClick={onAddBranch} className="w-full sm:w-auto rounded-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add another branch
          </Button>
        )}
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

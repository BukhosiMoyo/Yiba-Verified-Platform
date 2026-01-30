"use client";

import { useState, useEffect } from "react";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { OnboardingNavigation } from "../OnboardingNavigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { NEXT_OF_KIN_RELATIONSHIP_OPTIONS } from "@/lib/onboarding-constants";

interface NextOfKinStepProps {
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onAutoSave?: (data: any) => void;
}

export function NextOfKinStep({ initialData, onNext, onBack, onAutoSave }: NextOfKinStepProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [relationship, setRelationship] = useState(initialData?.relationship || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [address, setAddress] = useState(initialData?.address || "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Next of kin name is required";
    }

    if (!relationship) {
      newErrors.relationship = "Relationship is required";
    }

    if (!phone.trim()) {
      newErrors.phone = "Next of kin phone number is required";
    } else if (!/^(\+27|0)[0-9]{9}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid South African phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-save when fields change
  useEffect(() => {
    if (onAutoSave && (name || relationship || phone || address)) {
      onAutoSave({
        name: name.trim(),
        relationship,
        phone: phone.trim(),
        address: address.trim() || null,
      });
    }
  }, [name, relationship, phone, address, onAutoSave]);

  const handleNext = () => {
    if (validate()) {
      onNext({
        name: name.trim(),
        relationship,
        phone: phone.trim(),
        address: address.trim() || null,
      });
    }
  };

  return (
    <OnboardingStepWrapper
      title="Next of Kin"
      description="Please provide contact details for your next of kin. This is required for emergency contact."
    >
      <div className="space-y-6">
        {/* Name */}
        <div>
          <Label htmlFor="name">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Relationship */}
        <div>
          <Label htmlFor="relationship">
            Relationship <span className="text-red-500">*</span>
          </Label>
          <Select
            id="relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className={errors.relationship ? "border-red-500" : ""}
            aria-invalid={!!errors.relationship}
          >
            <option value="">Select relationship</option>
            {NEXT_OF_KIN_RELATIONSHIP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {errors.relationship && <p className="text-sm text-red-500 mt-1">{errors.relationship}</p>}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="082 123 4567 or +27 82 123 4567"
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
        </div>

        {/* Address (Optional) */}
        <div>
          <Label htmlFor="address">Address (Optional)</Label>
          <AddressAutocomplete
            id="address"
            value={address}
            onChange={setAddress}
            onSelect={() => {}}
            placeholder="Enter next of kin address (optional)"
            countryRestrictions={["za"]}
          />
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

"use client";

import { useState, useEffect } from "react";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { OnboardingNavigation } from "../OnboardingNavigation";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PROVINCES } from "@/lib/provinces";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import type { ParsedAddress } from "@/lib/address/parseGooglePlace";

interface AddressStepProps {
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onAutoSave?: (data: any) => void;
}

export function AddressStep({ initialData, onNext, onBack, onAutoSave }: AddressStepProps) {
  const [address, setAddress] = useState(initialData?.address || "");
  const [province, setProvince] = useState(initialData?.province || "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!province) {
      newErrors.province = "Province is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelect = (parsed: ParsedAddress) => {
    if (parsed.province) {
      setProvince(parsed.province);
    }
  };

  // Auto-save when fields change
  useEffect(() => {
    if (onAutoSave && (address || province)) {
      onAutoSave({
        address: address.trim(),
        province,
      });
    }
  }, [address, province, onAutoSave]);

  const handleNext = () => {
    if (validate()) {
      onNext({
        address: address.trim(),
        province,
      });
    }
  };

  return (
    <OnboardingStepWrapper
      title="Address & Location"
      description="Please provide your physical address. This is required for compliance."
    >
      <div className="space-y-6">
        {/* Address */}
        <div>
          <Label htmlFor="address">
            Physical Address <span className="text-red-500">*</span>
          </Label>
          <AddressAutocomplete
            id="address"
            value={address}
            onChange={setAddress}
            onSelect={handleSelect}
            placeholder="Start typing your address..."
            className={errors.address ? "border-red-500" : ""}
            error={!!errors.address}
            countryRestrictions={["za"]}
          />
          {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
        </div>

        {/* Province */}
        <div>
          <Label htmlFor="province">
            Province <span className="text-red-500">*</span>
          </Label>
          <Select
            id="province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className={errors.province ? "border-red-500" : ""}
            aria-invalid={!!errors.province}
          >
            <option value="">Select your province</option>
            {PROVINCES.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </Select>
          {errors.province && <p className="text-sm text-red-500 mt-1">{errors.province}</p>}
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

"use client";

import { useState, useEffect } from "react";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { OnboardingNavigation } from "../OnboardingNavigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { PROVINCES } from "@/lib/provinces";
import { GooglePlacesAutocomplete } from "@/components/shared/GooglePlacesAutocomplete";

interface AddressStepProps {
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

// Map Google address components to South African provinces
function extractProvinceFromAddress(
  addressComponents: google.maps.places.PlaceResult["address_components"]
): string {
  if (!addressComponents) return "";

  // Look for administrative_area_level_1 (province) or locality
  for (const component of addressComponents) {
    if (component.types.includes("administrative_area_level_1")) {
      const provinceName = component.long_name;
      // Map Google's province names to our PROVINCES list
      const provinceMap: Record<string, string> = {
        "Eastern Cape": "Eastern Cape",
        "Free State": "Free State",
        "Gauteng": "Gauteng",
        "KwaZulu-Natal": "KwaZulu-Natal",
        "Limpopo": "Limpopo",
        "Mpumalanga": "Mpumalanga",
        "Northern Cape": "Northern Cape",
        "North West": "North West",
        "Western Cape": "Western Cape",
      };

      // Try exact match first
      if (provinceMap[provinceName]) {
        return provinceMap[provinceName];
      }

      // Try case-insensitive match
      const found = Object.keys(provinceMap).find(
        (p) => p.toLowerCase() === provinceName.toLowerCase()
      );
      if (found) {
        return provinceMap[found];
      }
    }
  }

  return "";
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

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    // Auto-populate province if available
    if (place.address_components) {
      const extractedProvince = extractProvinceFromAddress(
        place.address_components
      );
      if (extractedProvince) {
        setProvince(extractedProvince);
      }
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
          <GooglePlacesAutocomplete
            id="address"
            value={address}
            onChange={setAddress}
            onPlaceSelect={handlePlaceSelect}
            placeholder="Start typing your address..."
            className={errors.address ? "border-red-500" : ""}
            error={!!errors.address}
            countryRestriction="za"
          />
          {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Start typing and select from suggestions. Province will be auto-filled if detected.
          </p>
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
            placeholder="Select your province"
            className={errors.province ? "border-red-500" : ""}
            aria-invalid={!!errors.province}
          >
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

"use client";

import { useState, useEffect } from "react";

const getStepData = (nationalId: string, birthDate: string, phone: string, gender: string, nationality: string, homeLanguage: string) => ({
  national_id: nationalId.trim(),
  birth_date: birthDate,
  phone: phone.trim(),
  gender_code: gender,
  nationality_code: nationality,
  home_language_code: homeLanguage || null,
});
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { OnboardingNavigation } from "../OnboardingNavigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { GENDER_OPTIONS, NATIONALITY_OPTIONS, HOME_LANGUAGE_OPTIONS } from "@/lib/onboarding-constants";
import { DatePickerV2 } from "@/components/ui/date-picker-v2";

interface PersonalInfoStepProps {
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onAutoSave?: (data: any) => void;
}

export function PersonalInfoStep({ initialData, onNext, onBack, onAutoSave }: PersonalInfoStepProps) {
  const [nationalId, setNationalId] = useState(initialData?.national_id || "");
  const [birthDate, setBirthDate] = useState<string>(
    initialData?.birth_date ? new Date(initialData.birth_date).toISOString().split("T")[0] : ""
  );
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [gender, setGender] = useState(initialData?.gender_code || "");
  const [nationality, setNationality] = useState(initialData?.nationality_code || "");
  const [homeLanguage, setHomeLanguage] = useState(initialData?.home_language_code || "");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!nationalId.trim()) {
      newErrors.nationalId = "ID number is required";
    } else if (nationalId.length < 13) {
      newErrors.nationalId = "ID number must be 13 digits";
    }

    if (!birthDate) {
      newErrors.birthDate = "Date of birth is required";
    } else {
      const date = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      if (age < 16 || age > 100) {
        newErrors.birthDate = "Please enter a valid date of birth";
      }
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^(\+27|0)[0-9]{9}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid South African phone number";
    }

    if (!gender) {
      newErrors.gender = "Gender is required";
    }

    if (!nationality) {
      newErrors.nationality = "Nationality is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-save when fields change
  useEffect(() => {
    if (onAutoSave && (nationalId || birthDate || phone || gender || nationality || homeLanguage)) {
      const stepData = getStepData(nationalId, birthDate, phone, gender, nationality, homeLanguage);
      onAutoSave(stepData);
    }
  }, [nationalId, birthDate, phone, gender, nationality, homeLanguage, onAutoSave]);

  const handleNext = () => {
    if (validate()) {
      onNext(getStepData(nationalId, birthDate, phone, gender, nationality, homeLanguage));
    }
  };

  const handleDateChange = (value: string) => {
    setBirthDate(value);
  };

  return (
    <OnboardingStepWrapper
      title="Personal Information"
      description="Please provide your personal details. All fields are required."
    >
      <div className="space-y-6">
        {/* ID Number */}
        <div>
          <Label htmlFor="nationalId">
            ID Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nationalId"
            type="text"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 13))}
            placeholder="Enter your 13-digit ID number"
            className={errors.nationalId ? "border-red-500" : ""}
          />
          {errors.nationalId && <p className="text-sm text-red-500 mt-1">{errors.nationalId}</p>}
          <p className="text-xs text-muted-foreground mt-1">Your South African ID number</p>
        </div>

        {/* Date of Birth */}
        <div>
          <Label htmlFor="birthDate">
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          <DatePickerV2
            id="birthDate"
            value={birthDate}
            onChange={handleDateChange}
            placeholder="Select your date of birth"
            error={!!errors.birthDate}
            maxDate={new Date()} // Can't be in the future
            minDate={new Date(new Date().setFullYear(new Date().getFullYear() - 100))} // Max 100 years ago
          />
          {errors.birthDate && <p className="text-sm text-red-500 mt-1">{errors.birthDate}</p>}
        </div>

        {/* Phone Number */}
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

        {/* Gender */}
        <div>
          <Label htmlFor="gender">
            Gender <span className="text-red-500">*</span>
          </Label>
          <Select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            placeholder="Select gender"
            className={errors.gender ? "border-red-500" : ""}
            aria-invalid={!!errors.gender}
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
        </div>

        {/* Nationality */}
        <div>
          <Label htmlFor="nationality">
            Nationality <span className="text-red-500">*</span>
          </Label>
          <Select
            id="nationality"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Select nationality"
            className={errors.nationality ? "border-red-500" : ""}
            aria-invalid={!!errors.nationality}
          >
            {NATIONALITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {errors.nationality && <p className="text-sm text-red-500 mt-1">{errors.nationality}</p>}
        </div>

        {/* Home Language */}
        <div>
          <Label htmlFor="homeLanguage">Home Language (Optional)</Label>
          <Select
            id="homeLanguage"
            value={homeLanguage}
            onChange={(e) => setHomeLanguage(e.target.value)}
            placeholder="Select home language"
          >
            <option value="">Not specified</option>
            {HOME_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
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

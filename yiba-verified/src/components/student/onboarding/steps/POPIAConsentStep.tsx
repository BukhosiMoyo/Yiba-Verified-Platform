"use client";

import { useState, useEffect } from "react";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { OnboardingNavigation } from "../OnboardingNavigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface POPIAConsentStepProps {
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onAutoSave?: (data: any) => void;
}

export function POPIAConsentStep({ initialData, onNext, onBack, onAutoSave }: POPIAConsentStepProps) {
  const [consent, setConsent] = useState(initialData?.consent === true);
  const [error, setError] = useState("");

  // Auto-save when consent changes
  useEffect(() => {
    if (onAutoSave) {
      onAutoSave({
        consent: consent,
      });
    }
  }, [consent, onAutoSave]);

  const handleNext = () => {
    if (!consent) {
      setError("You must provide consent to proceed");
      return;
    }

    onNext({
      consent: true,
    });
  };

  return (
    <OnboardingStepWrapper
      title="POPIA Consent"
      description="Please read and accept the consent statement to continue."
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Protection of Personal Information Act (POPIA) Consent</h3>
              <div className="text-sm text-muted-foreground space-y-3">
                <p>
                  By providing your consent, you acknowledge that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your personal information will be processed in accordance with the Protection of Personal Information Act (POPIA)</li>
                  <li>Your information will be used for educational and compliance purposes</li>
                  <li>Your information will be shared with relevant institutions and regulatory bodies as required</li>
                  <li>You have the right to access, correct, or delete your personal information</li>
                  <li>You can withdraw your consent at any time by contacting your institution</li>
                </ul>
                <p className="mt-4">
                  For more information about how we process your data, please contact your institution.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                setError("");
              }}
              className="mt-1"
            />
            <Label htmlFor="consent" className="text-sm font-normal leading-relaxed cursor-pointer">
              I consent to the processing of my personal information in accordance with POPIA and the terms described above.{" "}
              <span className="text-red-500">*</span>
            </Label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>

      <OnboardingNavigation
        onNext={handleNext}
        onBack={onBack}
        canGoBack={true}
        canGoNext={consent}
        nextLabel="I Consent & Continue"
      />
    </OnboardingStepWrapper>
  );
}

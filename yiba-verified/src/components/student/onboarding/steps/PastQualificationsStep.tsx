"use client";

import { useState, useEffect } from "react";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { OnboardingNavigation } from "../OnboardingNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PastQualificationsStepProps {
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
  onAutoSave?: (data: any) => void;
}

interface Qualification {
  id: string;
  title: string;
  institution: string;
  yearCompleted: string;
}

export function PastQualificationsStep({ initialData, onNext, onBack, onSkip, onAutoSave }: PastQualificationsStepProps) {
  const [qualifications, setQualifications] = useState<Qualification[]>(
    initialData?.qualifications || []
  );

  const addQualification = () => {
    setQualifications([
      ...qualifications,
      {
        id: Date.now().toString(),
        title: "",
        institution: "",
        yearCompleted: "",
      },
    ]);
  };

  const removeQualification = (id: string) => {
    setQualifications(qualifications.filter((q) => q.id !== id));
  };

  const updateQualification = (id: string, field: keyof Qualification, value: string) => {
    setQualifications(
      qualifications.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  // Auto-save when qualifications change
  useEffect(() => {
    if (onAutoSave) {
      const complete = qualifications.filter(
        (q) => q.title.trim() && q.institution.trim()
      );
      onAutoSave({
        qualifications: complete.map((q) => ({
          title: q.title.trim(),
          institution: q.institution.trim(),
          year_completed: q.yearCompleted ? parseInt(q.yearCompleted) : null,
        })),
      });
    }
  }, [qualifications, onAutoSave]);

  const handleNext = () => {
    // Filter out incomplete qualifications
    const complete = qualifications.filter(
      (q) => q.title.trim() && q.institution.trim()
    );
    onNext({
      qualifications: complete.map((q) => ({
        title: q.title.trim(),
        institution: q.institution.trim(),
        year_completed: q.yearCompleted ? parseInt(q.yearCompleted) : null,
      })),
    });
  };

  return (
    <OnboardingStepWrapper
      title="Past Qualifications"
      description="Add any degrees, certificates, or qualifications you completed before joining this institution. This is optional."
    >
      <div className="space-y-4">
        {qualifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No qualifications added yet.</p>
            <p className="text-sm mt-2">You can add qualifications now or skip and add them later in your profile.</p>
          </div>
        ) : (
          qualifications.map((qual) => (
            <Card key={qual.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Qualification {qualifications.indexOf(qual) + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQualification(qual.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <Label>Qualification Title</Label>
                  <Input
                    value={qual.title}
                    onChange={(e) => updateQualification(qual.id, "title", e.target.value)}
                    placeholder="e.g., National Certificate in Business Administration"
                  />
                </div>
                <div>
                  <Label>Institution</Label>
                  <Input
                    value={qual.institution}
                    onChange={(e) => updateQualification(qual.id, "institution", e.target.value)}
                    placeholder="Name of institution or training provider"
                  />
                </div>
                <div>
                  <Label>Year Completed (Optional)</Label>
                  <Input
                    type="number"
                    value={qual.yearCompleted}
                    onChange={(e) => updateQualification(qual.id, "yearCompleted", e.target.value)}
                    placeholder="e.g., 2020"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Button type="button" variant="outline" onClick={addQualification} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Qualification
        </Button>
      </div>

      <OnboardingNavigation
        onNext={handleNext}
        onBack={onBack}
        onSkip={onSkip}
        canGoBack={true}
        canGoNext={true}
        showSkip={true}
        nextLabel={qualifications.length > 0 ? "Continue" : "Skip & Continue"}
      />
    </OnboardingStepWrapper>
  );
}

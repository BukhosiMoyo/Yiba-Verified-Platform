"use client";

import { useState, useEffect } from "react";
import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { OnboardingNavigation } from "../OnboardingNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DatePickerV2 } from "@/components/ui/date-picker-v2";
import { Checkbox } from "@/components/ui/checkbox";

interface PriorLearningStepProps {
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
  onAutoSave?: (data: any) => void;
}

interface Learning {
  id: string;
  title: string;
  description: string;
  institution: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export function PriorLearningStep({ initialData, onNext, onBack, onSkip, onAutoSave }: PriorLearningStepProps) {
  const [learning, setLearning] = useState<Learning[]>(initialData?.learning || []);

  const addLearning = () => {
    setLearning([
      ...learning,
      {
        id: Date.now().toString(),
        title: "",
        description: "",
        institution: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
      },
    ]);
  };

  const removeLearning = (id: string) => {
    setLearning(learning.filter((l) => l.id !== id));
  };

  const updateLearning = (id: string, field: keyof Learning, value: string | boolean) => {
    setLearning(learning.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  // Auto-save when learning entries change
  useEffect(() => {
    if (onAutoSave) {
      const complete = learning.filter((l) => l.title.trim() && l.institution.trim());
      onAutoSave({
        learning: complete.map((l) => ({
          title: l.title.trim(),
          description: l.description.trim() || null,
          institution: l.institution.trim(),
          start_date: l.startDate || null,
          end_date: l.isCurrent ? null : l.endDate || null,
          is_current: l.isCurrent,
        })),
      });
    }
  }, [learning, onAutoSave]);

  const handleNext = () => {
    // Filter out incomplete entries
    const complete = learning.filter((l) => l.title.trim() && l.institution.trim());
    onNext({
      learning: complete.map((l) => ({
        title: l.title.trim(),
        description: l.description.trim() || null,
        institution: l.institution.trim(),
        start_date: l.startDate || null,
        end_date: l.isCurrent ? null : l.endDate || null,
        is_current: l.isCurrent,
      })),
    });
  };

  return (
    <OnboardingStepWrapper
      title="Prior Learning & Experience"
      description="Add any work experience, informal training, or prior learning you have. This is optional."
    >
      <div className="space-y-4">
        {learning.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No prior learning added yet.</p>
            <p className="text-sm mt-2">You can add experience now or skip and add it later in your profile.</p>
          </div>
        ) : (
          learning.map((learn) => (
            <Card key={learn.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Experience {learning.indexOf(learn) + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLearning(learn.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <Label>Title / Role</Label>
                  <Input
                    value={learn.title}
                    onChange={(e) => updateLearning(learn.id, "title", e.target.value)}
                    placeholder="e.g., Project Coordinator, Workplace Experience"
                  />
                </div>
                <div>
                  <Label>Institution / Workplace</Label>
                  <Input
                    value={learn.institution}
                    onChange={(e) => updateLearning(learn.id, "institution", e.target.value)}
                    placeholder="Name of workplace or training provider"
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={learn.description}
                    onChange={(e) => updateLearning(learn.id, "description", e.target.value)}
                    placeholder="Brief description of your role or experience"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date (Optional)</Label>
                    <DatePickerV2
                      value={learn.startDate}
                      onChange={(value) => updateLearning(learn.id, "startDate", value)}
                      placeholder="Start date"
                    />
                  </div>
                  <div>
                    <Label>End Date (Optional)</Label>
                    <DatePickerV2
                      value={learn.endDate}
                      onChange={(value) => updateLearning(learn.id, "endDate", value)}
                      placeholder="End date"
                      disabled={learn.isCurrent}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`current-${learn.id}`}
                    checked={learn.isCurrent}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      updateLearning(learn.id, "isCurrent", isChecked);
                      if (isChecked) {
                        updateLearning(learn.id, "endDate", "");
                      }
                    }}
                  />
                  <Label htmlFor={`current-${learn.id}`} className="text-sm font-normal cursor-pointer">
                    This is my current role
                  </Label>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Button type="button" variant="outline" onClick={addLearning} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>

      <OnboardingNavigation
        onNext={handleNext}
        onBack={onBack}
        onSkip={onSkip}
        canGoBack={true}
        canGoNext={true}
        showSkip={true}
        nextLabel={learning.length > 0 ? "Continue" : "Skip & Continue"}
      />
    </OnboardingStepWrapper>
  );
}

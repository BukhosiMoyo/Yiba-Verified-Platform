"use client";

import { useState } from "react";
import { InstitutionOnboardingStepWrapper } from "../InstitutionOnboardingStepWrapper";
import { OnboardingNavigation } from "@/components/student/onboarding/OnboardingNavigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { StaffInviteEntry } from "../types";

interface InviteStaffStepProps {
  staffInvites: StaffInviteEntry[];
  onUpdate: (index: number, field: keyof StaffInviteEntry, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const STAFF_ROLE = "INSTITUTION_STAFF";

export function InviteStaffStep({
  staffInvites,
  onUpdate,
  onAdd,
  onRemove,
  onNext,
  onBack,
  onSkip,
}: InviteStaffStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    staffInvites.forEach((inv, i) => {
      if (inv.email.trim()) {
        if (!emailRegex.test(inv.email.trim())) {
          newErrors[`email_${i}`] = "Please enter a valid email address";
        }
      } else if (inv.name.trim()) {
        newErrors[`email_${i}`] = "Email is required when adding a staff invite";
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      if (firstKey) {
        setTimeout(() => {
          const el = document.getElementById(firstKey);
          (el as HTMLInputElement | null)?.focus?.();
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
      title="Invite staff (optional)"
      description="Invite staff members to your institution. You can skip this step and invite them later from the dashboard."
      errorSummary={
        Object.keys(errors).length > 0
          ? "Please fix the errors below. Email is required for each invite."
          : undefined
      }
    >
      <div className="space-y-6">
        {staffInvites.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No staff invites added. Add one below or skip to continue.
            </p>
            <Button type="button" variant="outline" onClick={onAdd} className="rounded-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add staff invite
            </Button>
          </div>
        ) : (
          staffInvites.map((inv, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-muted/20 p-4 flex flex-col sm:flex-row gap-4 items-start"
            >
              <div className="flex-1 grid gap-3 sm:grid-cols-3 w-full">
                <div className="space-y-2">
                  <Label htmlFor={`staff_name_${i}`}>Name (optional)</Label>
                  <Input
                    id={`staff_name_${i}`}
                    value={inv.name}
                    onChange={(e) => onUpdate(i, "name", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`staff_email_${i}`}>
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`email_${i}`}
                    type="email"
                    value={inv.email}
                    onChange={(e) => onUpdate(i, "email", e.target.value)}
                    placeholder="email@example.com"
                    className={errors[`email_${i}`] ? "border-destructive" : ""}
                    aria-invalid={!!errors[`email_${i}`]}
                  />
                  {errors[`email_${i}`] && (
                    <p className="text-sm text-destructive">{errors[`email_${i}`]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`staff_role_${i}`}>Role (optional)</Label>
                  <Input
                    id={`staff_role_${i}`}
                    value={inv.role}
                    onChange={(e) => onUpdate(i, "role", e.target.value)}
                    placeholder="e.g. Staff"
                    readOnly
                    className="bg-muted/50 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Default: Institution Staff</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                onClick={() => onRemove(i)}
                aria-label={`Remove invite ${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
        {staffInvites.length > 0 && (
          <Button type="button" variant="outline" onClick={onAdd} className="w-full sm:w-auto rounded-lg">
            <Plus className="h-4 w-4 mr-2" />
            Add another
          </Button>
        )}
      </div>
      <OnboardingNavigation
        onNext={handleNext}
        onBack={onBack}
        onSkip={onSkip}
        canGoBack={true}
        canGoNext={true}
        showSkip={true}
        nextLabel="Next"
      />
    </InstitutionOnboardingStepWrapper>
  );
}

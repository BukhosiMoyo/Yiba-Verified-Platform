"use client";

import { InstitutionOnboardingStepWrapper } from "../InstitutionOnboardingStepWrapper";
import { OnboardingNavigation } from "@/components/student/onboarding/OnboardingNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Users, Loader2 } from "lucide-react";
import type { InstitutionFormEntry } from "../types";
import type { StaffInviteEntry } from "../types";
import { INSTITUTION_TYPES } from "../types";

interface ReviewConfirmStepProps {
  institutions: InstitutionFormEntry[];
  staffInvites: StaffInviteEntry[];
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  onEditStep: (step: number) => void;
  isSubmitting: boolean;
  submitError?: string;
}

const RESPONSIBILITIES = [
  "Manage your institution's profile and documents",
  "Create and manage learner records",
  "Track enrolments and attendance",
  "Submit readiness records and compliance packs to QCTO",
  "Manage institution staff and invitations",
];

export function ReviewConfirmStep({
  institutions,
  staffInvites,
  acknowledged,
  onAcknowledgedChange,
  onBack,
  onSubmit,
  onEditStep,
  isSubmitting,
  submitError,
}: ReviewConfirmStepProps) {
  const getTypeLabel = (value: string) =>
    INSTITUTION_TYPES.find((t) => t.value === value)?.label ?? value;

  return (
    <InstitutionOnboardingStepWrapper
      title="Review & confirm"
      description="Review your institution details and acknowledge your responsibilities to complete onboarding."
      errorSummary={submitError}
    >
      <div className="space-y-6">
        {/* Institutions summary */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Institution(s)</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditStep(4)}
                  className="gap-2"
                  disabled={isSubmitting}
                >
                  Delivery
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditStep(2)}
                  className="gap-2"
                  disabled={isSubmitting}
                >
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {institutions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No institutions added.</p>
            ) : (
              institutions.map((inst, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-muted/20 p-3 space-y-2"
                >
                  <div className="font-medium text-foreground">
                    {inst.legal_name || "—"}
                    {inst.branch_code.trim() ? ` (${inst.branch_code})` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>{getTypeLabel(inst.institution_type)} · {inst.registration_number || "—"}</div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {inst.physical_address || "—"}
                    </div>
                    {inst.province && <div>Province: {inst.province}</div>}
                    {i === 0 && (inst.offers_workplace_based_learning === "yes" || inst.offers_web_based_learning === "yes") && (
                      <div className="pt-1">
                        {inst.offers_workplace_based_learning === "yes" && <div>Workplace-based learning: Yes</div>}
                        {inst.offers_web_based_learning === "yes" && <div>Web-based (online) learning: Yes{inst.web_based_lms_name?.trim() ? ` · ${inst.web_based_lms_name}` : ""}</div>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Staff invites summary */}
        {staffInvites.filter((i) => i.email.trim()).length > 0 && (
          <Card className="border border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Staff invites</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {staffInvites
                  .filter((i) => i.email.trim())
                  .map((inv, i) => (
                    <li key={i}>
                      {inv.name?.trim() ? `${inv.name.trim()} — ` : ""}
                      {inv.email}
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Responsibilities + acknowledge */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Your responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              {RESPONSIBILITIES.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => onAcknowledgedChange(checked === true)}
                disabled={isSubmitting}
                aria-invalid={!!submitError && !acknowledged}
              />
              <Label
                htmlFor="acknowledge"
                className="text-sm cursor-pointer leading-tight text-foreground"
              >
                I acknowledge that I understand my responsibilities as an Institution Admin and will
                ensure accurate data entry and compliance with QCTO requirements.
              </Label>
            </div>
          </CardContent>
        </Card>

        <OnboardingNavigation
          onNext={onSubmit}
          onBack={onBack}
          canGoBack={true}
          canGoNext={acknowledged && !isSubmitting}
          isLoading={isSubmitting}
          nextLabel={isSubmitting ? "Completing..." : "Complete onboarding"}
        />
      </div>
    </InstitutionOnboardingStepWrapper>
  );
}

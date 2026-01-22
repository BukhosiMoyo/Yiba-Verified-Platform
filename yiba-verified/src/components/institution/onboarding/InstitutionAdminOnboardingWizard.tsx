"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function InstitutionAdminOnboardingWizard() {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!acknowledged) {
      toast.error("Please acknowledge the responsibilities");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/institution/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete onboarding");
      }

      toast.success("Onboarding completed successfully!");
      router.push("/institution");
      router.refresh();
    } catch (error: any) {
      console.error("Failed to complete onboarding:", error);
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Institution Admin Onboarding</CardTitle>
          <CardDescription>
            Welcome to Yiba Verified! As an Institution Admin, you can manage your institution's data and learners.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Your Responsibilities:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Manage your institution's profile and documents</li>
              <li>Create and manage learner records</li>
              <li>Track enrolments and attendance</li>
              <li>Submit readiness records and compliance packs to QCTO</li>
              <li>Manage institution staff and invitations</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Key Features:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Dashboard with institution overview</li>
              <li>Learner management and enrolment tracking</li>
              <li>Readiness record creation and submission</li>
              <li>Document management and upload</li>
              <li>View as staff/students for support</li>
            </ul>
          </div>

          <div className="flex items-start space-x-2 pt-4 border-t">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
            />
            <Label htmlFor="acknowledge" className="text-sm cursor-pointer">
              I acknowledge that I understand my responsibilities as an Institution Admin and will
              ensure accurate data entry and compliance with QCTO requirements.
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !acknowledged}
            >
              {isSubmitting ? "Completing..." : "Complete Onboarding"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

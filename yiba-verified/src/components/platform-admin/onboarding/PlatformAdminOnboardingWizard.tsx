"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function PlatformAdminOnboardingWizard() {
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
      const response = await fetch("/api/platform-admin/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete onboarding");
      }

      toast.success("Onboarding completed successfully!");
      router.push("/platform-admin");
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
          <CardTitle>Platform Admin Onboarding</CardTitle>
          <CardDescription>
            Welcome to Yiba Verified! As a Platform Admin, you have full access to the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Your Responsibilities:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Manage all users and institutions</li>
              <li>Configure system settings and announcements</li>
              <li>Monitor system health and audit logs</li>
              <li>Provide support to QCTO and institution users</li>
              <li>Ensure data security and compliance</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Key Features:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>View and manage all institutions</li>
              <li>Create and manage user accounts</li>
              <li>View as any user for support purposes</li>
              <li>Access comprehensive audit logs</li>
              <li>Manage system-wide announcements</li>
            </ul>
          </div>

          <div className="flex items-start space-x-2 pt-4 border-t">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
            />
            <Label htmlFor="acknowledge" className="text-sm cursor-pointer">
              I acknowledge that I understand my responsibilities as a Platform Admin and will use
              my access privileges responsibly.
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

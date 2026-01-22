"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PROVINCES } from "@/lib/provinces";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface QctoOnboardingWizardProps {
  initialData?: {
    default_province: string | null;
    assigned_provinces: string[];
  } | null;
  userRole?: string;
}

export function QctoOnboardingWizard({ initialData, userRole }: QctoOnboardingWizardProps) {
  const isSuperAdmin = userRole === "QCTO_SUPER_ADMIN";
  const router = useRouter();
  const [defaultProvince, setDefaultProvince] = useState<string>(
    initialData?.default_province || ""
  );
  const [assignedProvinces, setAssignedProvinces] = useState<string[]>(
    initialData?.assigned_provinces || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProvinceToggle = (province: string) => {
    setAssignedProvinces((prev) => {
      if (prev.includes(province)) {
        // Remove province
        const updated = prev.filter((p) => p !== province);
        // If default province was removed, clear it
        if (defaultProvince === province) {
          setDefaultProvince("");
        }
        return updated;
      } else {
        // Add province
        return [...prev, province];
      }
    });
  };

  const handleDefaultProvinceChange = (province: string) => {
    setDefaultProvince(province);
    // Ensure default province is in assigned provinces
    if (province && !assignedProvinces.includes(province)) {
      setAssignedProvinces([...assignedProvinces, province]);
    }
  };

  const handleSubmit = async () => {
    // Validation (skip for QCTO_SUPER_ADMIN)
    if (!isSuperAdmin) {
      if (!defaultProvince) {
        toast.error("Please select a default province");
        return;
      }

      if (assignedProvinces.length === 0) {
        toast.error("Please select at least one assigned province");
        return;
      }

      if (!assignedProvinces.includes(defaultProvince)) {
        toast.error("Default province must be included in assigned provinces");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/qcto/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_province: isSuperAdmin ? null : defaultProvince,
          assigned_provinces: isSuperAdmin ? [] : assignedProvinces,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete onboarding");
      }

      toast.success("Onboarding completed successfully!");
      router.push("/qcto");
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
          <CardTitle>QCTO Onboarding</CardTitle>
          <CardDescription>
            Please configure your province assignments. This determines which provinces you can access and review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isSuperAdmin && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Default Province:</strong> Your primary work location. This is required for all QCTO roles except QCTO_SUPER_ADMIN.
                <br />
                <strong>Assigned Provinces:</strong> All provinces you can access and review. You can be assigned to multiple provinces.
              </AlertDescription>
            </Alert>
          )}

          {isSuperAdmin && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                As QCTO Super Admin, you have access to all provinces. No province assignment is required.
              </AlertDescription>
            </Alert>
          )}

          {/* Default Province */}
          {!isSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="default-province">
                Default Province <span className="text-destructive">*</span>
              </Label>
            <Select
              id="default-province"
              value={defaultProvince}
              onChange={(e) => handleDefaultProvinceChange(e.target.value)}
              placeholder="Select your default province"
            >
              <option value="" disabled>
                Select your default province
              </option>
              {PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </Select>
              <p className="text-sm text-muted-foreground">
                Your primary work location. This must be included in your assigned provinces.
              </p>
            </div>
          )}

          {/* Assigned Provinces */}
          {!isSuperAdmin && (
            <div className="space-y-2">
              <Label>
                Assigned Provinces <span className="text-destructive">*</span>
              </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg">
              {PROVINCES.map((province) => (
                <div key={province} className="flex items-center space-x-2">
                  <Checkbox
                    id={`province-${province}`}
                    checked={assignedProvinces.includes(province)}
                    onCheckedChange={() => handleProvinceToggle(province)}
                  />
                  <Label
                    htmlFor={`province-${province}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {province}
                  </Label>
                </div>
              ))}
            </div>
              <p className="text-sm text-muted-foreground">
                Select all provinces you can access and review. You must select at least one province.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (!isSuperAdmin && (!defaultProvince || assignedProvinces.length === 0))
              }
            >
              {isSubmitting ? "Completing..." : "Complete Onboarding"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

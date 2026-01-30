"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PROVINCES } from "@/lib/provinces";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

interface QctoOnboardingWizardProps {
  initialData?: {
    default_province: string | null;
    assigned_provinces: string[];
  } | null;
  userRole?: string;
  /** User's first name (or "there") for a personalised welcome */
  userName?: string;
}

export function QctoOnboardingWizard({ initialData, userRole, userName = "there" }: QctoOnboardingWizardProps) {
  const isSuperAdmin = userRole === "QCTO_SUPER_ADMIN";
  const { update: updateSession } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const inviteAccepted =
    !isSuperAdmin &&
    !!initialData?.default_province &&
    Array.isArray(initialData?.assigned_provinces) &&
    initialData.assigned_provinces.length > 0;

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
        const updated = prev.filter((p) => p !== province);
        if (defaultProvince === province) setDefaultProvince("");
        return updated;
      }
      return [...prev, province];
    });
  };

  const handleDefaultProvinceChange = (province: string) => {
    setDefaultProvince(province);
    if (province && !assignedProvinces.includes(province)) {
      setAssignedProvinces([...assignedProvinces, province]);
    }
  };

  const submitWithProvinces = async (
    def: string | null,
    assigned: string[]
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/qcto/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_province: isSuperAdmin ? null : def,
          assigned_provinces: isSuperAdmin ? [] : assigned,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Failed to complete onboarding"
        );
      }
      await updateSession({ onboarding_completed: true });
      toast.success("You're all set! Taking you to the dashboard…");
      window.location.href = "/qcto";
    } catch (e: any) {
      console.error("QCTO onboarding complete error:", e);
      toast.error(e?.message || "Failed to complete onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (inviteAccepted) {
      await submitWithProvinces(
        initialData!.default_province!,
        initialData!.assigned_provinces!
      );
      return;
    }
    if (isSuperAdmin) {
      await submitWithProvinces(null, []);
      return;
    }
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
    await submitWithProvinces(defaultProvince, assignedProvinces);
  };

  const getConfirmLabel = () => {
    if (inviteAccepted) return "Confirm and continue to dashboard";
    if (isSuperAdmin) return "Complete onboarding";
    return "Complete onboarding";
  };

  const getDescription = () => {
    const welcome = "You're one step away from the QCTO dashboard.";
    if (isSuperAdmin) {
      return `${welcome} As QCTO Super Admin, you have access to all provinces. No province assignment is required.`;
    }
    if (inviteAccepted) {
      return `${welcome} Your province assignment was set when you accepted the invite. Confirm below to continue.`;
    }
    return `${welcome} Please configure your province assignments. This determines which provinces you can access and review.`;
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="qcto-onboarding-title"
    >
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xl"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="overflow-hidden border-0 shadow-xl dark:shadow-2xl dark:shadow-black/40 bg-card dark:bg-zinc-900/95 ring-1 ring-border/80 dark:ring-white/10">
          <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent border-b border-border/60 dark:border-white/10 px-6 pt-8 pb-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 dark:bg-primary/25 text-primary ring-2 ring-primary/20 dark:ring-primary/30">
                <Sparkles className="h-6 w-6" strokeWidth={1.8} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle
                  id="qcto-onboarding-title"
                  className="text-xl sm:text-2xl text-foreground dark:text-white"
                >
                  Welcome, {userName}!
                </CardTitle>
                <CardDescription className="mt-1.5 text-base text-muted-foreground dark:text-zinc-400">
                  {getDescription()}
                </CardDescription>
              </div>
            </div>
          </div>

          <CardContent className="space-y-6 p-6 pt-6">
            {inviteAccepted && (
              <Alert
                variant="info"
                title="Your assignment"
                description={
                  <>
                    <strong>Default province:</strong> {initialData!.default_province}.
                    <br />
                    <strong>Assigned provinces:</strong>{" "}
                    {initialData!.assigned_provinces!.join(", ")}. These cannot be changed.
                  </>
                }
              />
            )}

            {!isSuperAdmin && !inviteAccepted && (
              <>
                <Alert
                  variant="default"
                  title="Province assignment"
                  description={
                    <>
                      <strong>Default Province:</strong> Your primary work location. Required for all
                      QCTO roles except QCTO_SUPER_ADMIN.
                      <br />
                      <strong>Assigned Provinces:</strong> Provinces you can access and review. You
                      can be assigned to multiple.
                    </>
                  }
                />

                <div className="space-y-2">
                  <Label htmlFor="default-province">
                    Default Province <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    id="default-province"
                    value={defaultProvince}
                    onChange={(e) => handleDefaultProvinceChange(e.target.value)}
                  >
                    <option value="">Select your default province</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Your primary work location. Must be included in assigned provinces.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    Assigned Provinces <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg border-border dark:border-white/10">
                    {PROVINCES.map((p) => (
                      <div key={p} className="flex items-center space-x-2">
                        <Checkbox
                          id={`province-${p}`}
                          checked={assignedProvinces.includes(p)}
                          onCheckedChange={() => handleProvinceToggle(p)}
                        />
                        <Label
                          htmlFor={`province-${p}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {p}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select all provinces you can access and review. At least one required.
                  </p>
                </div>
              </>
            )}

            {isSuperAdmin && (
              <Alert
                variant="default"
                title="Super Admin"
                description="You have access to all provinces. No province assignment is required."
              />
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  (!isSuperAdmin &&
                    !inviteAccepted &&
                    (!defaultProvince || assignedProvinces.length === 0))
                }
                className="min-w-[180px] bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground shadow-md hover:shadow-lg transition-all"
              >
                {isSubmitting ? "Completing…" : getConfirmLabel()}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (!mounted || typeof document === "undefined") {
    return (
      <div className="max-w-2xl mx-auto py-8 opacity-0 pointer-events-none">
        <Card>
          <CardHeader>
            <CardTitle>QCTO Onboarding</CardTitle>
            <CardDescription>Loading…</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    );
  }

  return createPortal(overlay, document.body);
}

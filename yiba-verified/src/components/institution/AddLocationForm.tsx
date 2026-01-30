"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { PROVINCES } from "@/lib/provinces";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ParsedAddress } from "@/lib/address/parseGooglePlace";

const INSTITUTION_TYPES = [
  { value: "TVET", label: "TVET" },
  { value: "PRIVATE_SDP", label: "Private SDP" },
  { value: "NGO", label: "NGO" },
  { value: "UNIVERSITY", label: "University" },
  { value: "OTHER", label: "Other" },
] as const;

const STEP_TITLES = ["Institution details", "Address", "Contact"] as const;
const TOTAL_STEPS = 3;

type FormState = {
  legal_name: string;
  trading_name: string;
  institution_type: string;
  registration_number: string;
  branch_code: string;
  physical_address: string;
  postal_address: string;
  province: string;
  contact_person_name: string;
  contact_email: string;
  contact_number: string;
};

const emptyForm = (): FormState => ({
  legal_name: "",
  trading_name: "",
  institution_type: "",
  registration_number: "",
  branch_code: "",
  physical_address: "",
  postal_address: "",
  province: "",
  contact_person_name: "",
  contact_email: "",
  contact_number: "",
});

type AddLocationFormProps = {
  onSuccess: (institutionId: string) => void;
  onCancel: () => void;
};

export function AddLocationForm({ onSuccess, onCancel }: AddLocationFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  function validateStep1(): boolean {
    if (!form.legal_name.trim()) {
      toast.error("Legal name is required");
      return false;
    }
    if (!form.institution_type) {
      toast.error("Institution type is required");
      return false;
    }
    if (!form.registration_number.trim()) {
      toast.error("Registration number is required");
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    if (!form.physical_address.trim()) {
      toast.error("Physical address is required");
      return false;
    }
    if (!form.province.trim()) {
      toast.error("Province is required");
      return false;
    }
    return true;
  }

  function validateAll(): boolean {
    if (!validateStep1()) return false;
    if (!validateStep2()) return false;
    return true;
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3) return;
    if (!validateAll()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/institution/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legal_name: form.legal_name.trim(),
          trading_name: form.trading_name.trim() || null,
          institution_type: form.institution_type,
          registration_number: form.registration_number.trim(),
          branch_code: form.branch_code.trim() || null,
          physical_address: form.physical_address.trim(),
          postal_address: form.postal_address.trim() || null,
          province: form.province.trim(),
          contact_person_name: form.contact_person_name.trim() || null,
          contact_email: form.contact_email.trim() || null,
          contact_number: form.contact_number.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add location");
      }
      toast.success("Location added successfully");
      onSuccess(data.institutionId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add location");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Step indicator */}
      <div
        className="rounded-xl border border-border bg-muted/30 p-4 space-y-3"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label={`Step ${step} of ${TOTAL_STEPS}: ${STEP_TITLES[step - 1]}`}
      >
        <span className="text-sm font-medium text-foreground">
          Step {step} of {TOTAL_STEPS}: {STEP_TITLES[step - 1]}
        </span>
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                s < step
                  ? "bg-primary"
                  : s === step
                    ? "bg-primary ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                    : "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add_legal_name">Legal name *</Label>
            <Input
              id="add_legal_name"
              value={form.legal_name}
              onChange={(e) => update("legal_name", e.target.value)}
              placeholder="Registered legal name"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add_trading_name">Trading name (optional)</Label>
            <Input
              id="add_trading_name"
              value={form.trading_name}
              onChange={(e) => update("trading_name", e.target.value)}
              placeholder="Trading as"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add_institution_type">Institution type *</Label>
            <Select
              value={form.institution_type}
              onValueChange={(v) => update("institution_type", v)}
            >
              <SelectTrigger id="add_institution_type" className="rounded-lg">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="add_registration_number">Registration number *</Label>
              <Input
                id="add_registration_number"
                value={form.registration_number}
                onChange={(e) => update("registration_number", e.target.value)}
                placeholder="e.g. 2021/123456/08"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_branch_code">Branch or location code (optional)</Label>
              <Input
                id="add_branch_code"
                value={form.branch_code}
                onChange={(e) => update("branch_code", e.target.value)}
                placeholder="e.g. HQ, CPT-01"
                className="rounded-lg"
              />
              <p className="text-xs text-muted-foreground">
                Unique code to identify this branch or location.
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add_physical_address">Physical address *</Label>
            <AddressAutocomplete
              id="add_physical_address"
              value={form.physical_address}
              onChange={(v) => update("physical_address", v)}
              onSelect={(parsed: ParsedAddress) => {
                if (parsed.province) update("province", parsed.province);
              }}
              placeholder="Street, city, code"
              className="rounded-lg"
              countryRestrictions={["za"]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add_postal_address">Postal address (optional)</Label>
            <AddressAutocomplete
              id="add_postal_address"
              value={form.postal_address}
              onChange={(v) => update("postal_address", v)}
              onSelect={() => {}}
              placeholder="P.O. Box or same as physical"
              className="rounded-lg"
              countryRestrictions={["za"]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add_province">Province *</Label>
            <Select value={form.province} onValueChange={(v) => update("province", v)}>
              <SelectTrigger id="add_province" className="rounded-lg">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="add_contact_person">Contact person (optional)</Label>
              <Input
                id="add_contact_person"
                value={form.contact_person_name}
                onChange={(e) => update("contact_person_name", e.target.value)}
                placeholder="Full name"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_contact_email">Contact email (optional)</Label>
              <Input
                id="add_contact_email"
                type="email"
                value={form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
                placeholder="email@example.com"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_contact_number">Contact number (optional)</Label>
              <Input
                id="add_contact_number"
                value={form.contact_number}
                onChange={(e) => update("contact_number", e.target.value)}
                placeholder="+27..."
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        {step === 1 ? (
          <>
            <Button type="button" variant="outline" onClick={onCancel} className="rounded-lg">
              Cancel
            </Button>
            <Button type="button" onClick={handleNext} className="rounded-lg">
              Next
            </Button>
          </>
        ) : step === 2 ? (
          <>
            <Button type="button" variant="outline" onClick={handleBack} className="rounded-lg">
              Back
            </Button>
            <Button type="button" onClick={handleNext} className="rounded-lg">
              Next
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={handleBack} className="rounded-lg">
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-lg">
              {isSubmitting ? "Adding..." : "Add location"}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

"use client";

import { useState, useEffect } from "react";
import { AccountPage, AccountSection } from "@/components/account/AccountPage";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";

const STORAGE_KEY = "yv_qcto_scope_assignments";

const PROVINCES = [
  { value: "Eastern Cape", label: "Eastern Cape" },
  { value: "Free State", label: "Free State" },
  { value: "Gauteng", label: "Gauteng" },
  { value: "KwaZulu-Natal", label: "KwaZulu-Natal" },
  { value: "Limpopo", label: "Limpopo" },
  { value: "Mpumalanga", label: "Mpumalanga" },
  { value: "Northern Cape", label: "Northern Cape" },
  { value: "North West", label: "North West" },
  { value: "Western Cape", label: "Western Cape" },
];

const INSTITUTION_TYPES = [
  { value: "TVET", label: "TVET" },
  { value: "PRIVATE_SDP", label: "Private SDP" },
  { value: "NGO", label: "NGO" },
  { value: "UNIVERSITY", label: "University" },
  { value: "OTHER", label: "Other" },
];

const NQF_LEVELS = [
  { value: "2", label: "NQF 2" },
  { value: "3", label: "NQF 3" },
  { value: "4", label: "NQF 4" },
  { value: "5", label: "NQF 5" },
  { value: "6", label: "NQF 6" },
];

type StoredPrefs = {
  scopeProvinces: string[];
  scopeInstitutionTypes: string[];
  scopeNqfLevels: string[];
  assignmentAutoAssign: boolean;
  assignmentNotifyOnMatch: boolean;
};

const DEFAULT_PREFS: StoredPrefs = {
  scopeProvinces: [],
  scopeInstitutionTypes: [],
  scopeNqfLevels: [],
  assignmentAutoAssign: true,
  assignmentNotifyOnMatch: true,
};

function loadPrefs(): StoredPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    return {
      scopeProvinces: Array.isArray(parsed.scopeProvinces) ? parsed.scopeProvinces : DEFAULT_PREFS.scopeProvinces,
      scopeInstitutionTypes: Array.isArray(parsed.scopeInstitutionTypes) ? parsed.scopeInstitutionTypes : DEFAULT_PREFS.scopeInstitutionTypes,
      scopeNqfLevels: Array.isArray(parsed.scopeNqfLevels) ? parsed.scopeNqfLevels : DEFAULT_PREFS.scopeNqfLevels,
      assignmentAutoAssign: typeof parsed.assignmentAutoAssign === "boolean" ? parsed.assignmentAutoAssign : DEFAULT_PREFS.assignmentAutoAssign,
      assignmentNotifyOnMatch: typeof parsed.assignmentNotifyOnMatch === "boolean" ? parsed.assignmentNotifyOnMatch : DEFAULT_PREFS.assignmentNotifyOnMatch,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(p: StoredPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

export default function ScopeAssignmentsPage() {
  const [prefs, setPrefs] = useState<StoredPrefs>(DEFAULT_PREFS);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
    setMounted(true);
  }, []);

  const update = (patch: Partial<StoredPrefs>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      savePrefs(prefs);
      toast.success("Preferences saved on this device.");
    } catch {
      toast.error("Could not save preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) {
    return (
      <AccountPage title="Scope / Assignments" subtitle="Manage your QCTO scope and assignment preferences">
        <AccountSection title="Scope & Assignments" description="Configure your QCTO scope and assignment settings">
          <div className="py-8 text-center text-gray-500 text-sm">Loading…</div>
        </AccountSection>
      </AccountPage>
    );
  }

  return (
    <AccountPage
      title="Scope / Assignments"
      subtitle="Manage your QCTO scope and assignment preferences"
    >
      <AccountSection
        title="Review scope"
        description="Provinces, institution types, and NQF levels you review. Leave empty to include all."
      >
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium text-gray-700">Provinces</Label>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">Institutions in these provinces are in your scope.</p>
            <MultiSelect
              options={PROVINCES}
              value={prefs.scopeProvinces}
              onChange={(v) => update({ scopeProvinces: v })}
              placeholder="All provinces"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Institution types</Label>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">TVET, Private SDP, NGO, University, Other.</p>
            <MultiSelect
              options={INSTITUTION_TYPES}
              value={prefs.scopeInstitutionTypes}
              onChange={(v) => update({ scopeInstitutionTypes: v })}
              placeholder="All types"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">NQF levels</Label>
            <p className="text-xs text-gray-500 mt-0.5 mb-2">Qualifications at these NQF levels are in your scope.</p>
            <MultiSelect
              options={NQF_LEVELS}
              value={prefs.scopeNqfLevels}
              onChange={(v) => update({ scopeNqfLevels: v })}
              placeholder="All levels"
            />
          </div>
        </div>
      </AccountSection>

      <AccountSection
        title="Assignment preferences"
        description="How you receive and get notified about work that matches your scope"
      >
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-assign" className="text-sm font-medium text-gray-700">
                Include me in auto-assignment
              </Label>
              <p className="text-sm text-gray-500">
                When new submissions or requests match your scope, you may be assigned to review them.
              </p>
            </div>
            <Switch
              id="auto-assign"
              checked={prefs.assignmentAutoAssign}
              onCheckedChange={(v) => update({ assignmentAutoAssign: !!v })}
            />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="notify-match" className="text-sm font-medium text-gray-700">
                Notify when new items match my scope
              </Label>
              <p className="text-sm text-gray-500">
                Receive a notification when submissions or requests that match your scope are created.
              </p>
            </div>
            <Switch
              id="notify-match"
              checked={prefs.assignmentNotifyOnMatch}
              onCheckedChange={(v) => update({ assignmentNotifyOnMatch: !!v })}
            />
          </div>
        </div>
      </AccountSection>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-gray-500">
          Preferences are stored on this device. Account sync is coming soon.
        </p>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </AccountPage>
  );
}

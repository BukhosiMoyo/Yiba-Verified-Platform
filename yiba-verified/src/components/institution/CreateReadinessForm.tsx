"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { DeliveryMode } from "@prisma/client";
import { GraduationCap, BookOpen, Loader2, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { QualificationPicker, type QualificationRegistryItem } from "./QualificationPicker";

const DRAFT_KEY = "readiness-draft";
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type FormState = {
  qualification_registry_id: string | null;
  qualification_title: string;
  saqa_id: string;
  nqf_level: string;
  curriculum_code: string;
  credits: string;
  occupational_category: string;
  delivery_mode: DeliveryMode;
};

function loadDraft(): FormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as FormState & { savedAt?: string };
    if (d.savedAt && Date.now() - new Date(d.savedAt).getTime() > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return {
      qualification_registry_id: d.qualification_registry_id ?? null,
      qualification_title: d.qualification_title || "",
      saqa_id: d.saqa_id || "",
      nqf_level: d.nqf_level || "",
      curriculum_code: d.curriculum_code || "",
      credits: d.credits ?? "",
      occupational_category: d.occupational_category ?? "",
      delivery_mode: (d.delivery_mode || "FACE_TO_FACE") as DeliveryMode,
    };
  } catch {
    return null;
  }
}

function saveDraftToStorage(data: FormState) {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...data, savedAt: new Date().toISOString() })
    );
  } catch {}
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

const STEPS = [
  {
    id: 1,
    title: "What qualification is this for?",
    subtitle: "Start with the qualification details.",
    fields: ["qualification_title", "saqa_id", "nqf_level"] as const,
    Icon: GraduationCap,
    bg: "from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10",
    iconBg: "bg-primary/10 dark:bg-primary/20",
    iconColor: "text-primary",
  },
  {
    id: 2,
    title: "Curriculum & delivery",
    subtitle: "Add the curriculum code and how you’ll deliver the programme.",
    fields: ["curriculum_code", "delivery_mode"] as const,
    Icon: BookOpen,
    bg: "from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10",
    iconBg: "bg-primary/10 dark:bg-primary/20",
    iconColor: "text-primary",
  },
];

const TOTAL = STEPS.length;

export function CreateReadinessForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormState>({
    qualification_registry_id: null,
    qualification_title: "",
    saqa_id: "",
    nqf_level: "",
    curriculum_code: "",
    credits: "",
    occupational_category: "",
    delivery_mode: "FACE_TO_FACE",
  });
  const [selectedRegistry, setSelectedRegistry] = useState<QualificationRegistryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setFormData(draft);
      const firstEmpty = STEPS.findIndex((s) =>
        s.fields.some((f) => {
          const v = (draft as any)[f];
          return f === "nqf_level" ? false : !v || String(v).trim() === "";
        })
      );
      if (firstEmpty >= 0) setStep(firstEmpty + 1);
      else setStep(TOTAL);
      toast.info("We’ve restored your progress. Pick up where you left off.");
    }
  }, []);

  const update = useCallback((key: keyof FormState, value: string | DeliveryMode | null) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePickerSelect = useCallback((item: QualificationRegistryItem | null) => {
    setSelectedRegistry(item);
    if (item) {
      setFormData((prev) => ({
        ...prev,
        qualification_registry_id: item.id,
        qualification_title: item.name,
        saqa_id: item.saqa_id ?? "",
        nqf_level: item.nqf_level != null ? String(item.nqf_level) : "",
        curriculum_code: item.curriculum_code ?? "",
        credits: item.credits != null ? String(item.credits) : "",
        occupational_category: item.occupational_category ?? "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        qualification_registry_id: null,
        qualification_title: prev.qualification_title,
        saqa_id: prev.saqa_id,
        nqf_level: prev.nqf_level,
        curriculum_code: prev.curriculum_code,
        credits: prev.credits,
        occupational_category: prev.occupational_category,
      }));
    }
  }, []);

  const canProceed = useCallback(() => {
    const s = STEPS[step - 1];
    for (const f of s.fields) {
      if (f === "nqf_level") continue;
      const v = (formData as any)[f];
      if (!v || String(v).trim() === "") return false;
    }
    return true;
  }, [step, formData]);

  const handleNext = () => {
    if (!canProceed()) return;
    setError(null);
    if (step < TOTAL) setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSaveProgress = () => {
    saveDraftToStorage(formData);
    toast.success("Progress saved. Come back anytime to continue.");
    router.push("/institution/readiness");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const createData: Record<string, unknown> = {
        qualification_registry_id: formData.qualification_registry_id || undefined,
        qualification_title: formData.qualification_title.trim(),
        saqa_id: formData.saqa_id.trim(),
        curriculum_code: formData.curriculum_code.trim(),
        delivery_mode: formData.delivery_mode,
      };
      if (formData.nqf_level) {
        const n = parseInt(formData.nqf_level, 10);
        if (!isNaN(n)) createData.nqf_level = n;
      }
      if (formData.credits) {
        const c = parseInt(formData.credits, 10);
        if (!isNaN(c)) createData.credits = c;
      }
      if (formData.occupational_category?.trim()) createData.occupational_category = formData.occupational_category.trim();

      const res = await fetch("/api/institutions/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create readiness record");
      }

      clearDraft();
      toast.success("Readiness record created successfully!");
      const r = await res.json();
      router.push(`/institution/readiness/${r.readiness_id}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  const current = STEPS[step - 1];
  const isLast = step === TOTAL;
  const progress = (step / TOTAL) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Step {step} of {TOTAL}</span>
          <button
            type="button"
            onClick={handleSaveProgress}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <Save className="h-4 w-4" />
            Save & continue later
          </button>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step card */}
      <div className="rounded-2xl border border-border bg-card shadow-lg dark:shadow-none overflow-hidden">
        {/* Illustration */}
        <div
          className={`h-40 flex items-center justify-center bg-gradient-to-br ${current.bg}`}
          aria-hidden
        >
          <div className={`rounded-2xl p-6 ${current.iconBg}`}>
            <current.Icon
              className={`h-16 w-16 ${current.iconColor}`}
              strokeWidth={1.5}
            />
          </div>
        </div>

        <div className="px-6 py-8 md:px-8 md:py-10">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{current.title}</h2>
          <p className="mt-2 text-muted-foreground">{current.subtitle}</p>

          <form onSubmit={isLast ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="mt-8 space-y-6">
            {(current.fields as readonly string[]).includes("qualification_title") && (
              <>
                <div className="space-y-2">
                  <QualificationPicker
                    apiPath="/api/institutions/qualifications"
                    label="Search qualification (registry)"
                    value={selectedRegistry}
                    onSelect={handlePickerSelect}
                    placeholder="Search by name, SAQA ID, or curriculum code…"
                  />
                  {selectedRegistry && (
                    <p className="text-xs text-muted-foreground">Qualification selected from registry. Fields below are auto-filled; you can still edit if needed.</p>
                  )}
                  {!selectedRegistry && (formData.qualification_title || formData.saqa_id) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">Manual entry — this qualification is not in the registry (unregistered).</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualification_title">Qualification title *</Label>
                  <Input
                    id="qualification_title"
                    value={formData.qualification_title}
                    onChange={(e) => update("qualification_title", e.target.value)}
                    placeholder="e.g. Project Manager"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saqa_id">SAQA ID *</Label>
                  <Input
                    id="saqa_id"
                    value={formData.saqa_id}
                    onChange={(e) => update("saqa_id", e.target.value)}
                    placeholder="e.g. 66869"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nqf_level">NQF level <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="nqf_level"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.nqf_level}
                    onChange={(e) => update("nqf_level", e.target.value)}
                    placeholder="e.g. 6"
                    className="h-12 text-base"
                  />
                </div>
              </>
            )}
            {(current.fields as readonly string[]).includes("curriculum_code") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="curriculum_code">Curriculum code *</Label>
                  <Input
                    id="curriculum_code"
                    value={formData.curriculum_code}
                    onChange={(e) => update("curriculum_code", e.target.value)}
                    placeholder="e.g. 66869-00-00"
                    className="h-12 text-base"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="credits"
                      type="number"
                      min={0}
                      value={formData.credits}
                      onChange={(e) => update("credits", e.target.value)}
                      placeholder="e.g. 360"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupational_category">Occupational category <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      id="occupational_category"
                      value={formData.occupational_category}
                      onChange={(e) => update("occupational_category", e.target.value)}
                      placeholder="Optional"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
              </>
            )}
            {(current.fields as readonly string[]).includes("delivery_mode") && (
              <div className="space-y-2">
                <Label htmlFor="delivery_mode">Delivery mode *</Label>
                <Select
                  id="delivery_mode"
                  value={formData.delivery_mode}
                  onChange={(e) => update("delivery_mode", e.target.value as DeliveryMode)}
                  className="h-12 text-base"
                >
                  <option value="FACE_TO_FACE">Face to face</option>
                  <option value="BLENDED">Blended</option>
                  <option value="MOBILE">Mobile</option>
                </Select>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step <= 1 || isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              {isLast ? (
                <Button type="submit" disabled={isSubmitting || !canProceed()}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create readiness record
                </Button>
              ) : (
                <Button type="submit" disabled={!canProceed()}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

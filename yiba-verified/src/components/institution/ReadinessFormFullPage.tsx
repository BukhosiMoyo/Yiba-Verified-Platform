"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ChevronLeft, ChevronRight, Check, AlertTriangle, FileCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReadinessFormStepContent } from "@/components/institution/ReadinessFormStepContent";
import { ReadinessFormSidebar } from "@/components/institution/ReadinessFormSidebar";
import type { Readiness, DeliveryMode, ReadinessStatus } from "@prisma/client";

const STEP_TITLES = [
  "Qualification",
  "Self-Assessment",
  "Registration & Legal",
  "Infrastructure",
  "Learning Materials",
  "OHS",
  "LMS & Online",
  "WBL",
  "Policies",
  "Facilitators",
];
const totalSteps = 10;
const DEBOUNCE_MS = 700;

type FormDataLike = {
  qualification_title?: string;
  saqa_id?: string;
  curriculum_code?: string;
  delivery_mode?: string;
  self_assessment_completed?: boolean | null;
  registration_type?: string;
  professional_body_registration?: boolean | null;
  training_site_address?: string;
  learning_material_exists?: boolean | null;
  fire_extinguisher_available?: boolean | null;
  emergency_exits_marked?: boolean | null;
  lms_name?: string;
  wbl_workplace_partner_name?: string;
  policies_procedures_notes?: string;
  facilitators_notes?: string;
};

function getCompletionFromFormData(f: FormDataLike) {
  const delivery = f.delivery_mode || "FACE_TO_FACE";
  const sections = [
    { id: "qualification", name: "Qualification Information", completed: !!(f.qualification_title?.trim() && f.saqa_id?.trim() && f.curriculum_code?.trim() && f.delivery_mode), required: true },
    { id: "self_assessment", name: "Self-Assessment", completed: f.self_assessment_completed != null, required: false },
    { id: "registration", name: "Registration & Legal Compliance", completed: !!(f.registration_type?.trim() || f.professional_body_registration != null), required: false },
    { id: "infrastructure", name: "Infrastructure & Resources", completed: !!f.training_site_address?.trim(), required: false },
    { id: "learning_materials", name: "Learning Material Alignment", completed: f.learning_material_exists != null, required: false },
    { id: "ohs", name: "Occupational Health & Safety", completed: f.fire_extinguisher_available != null || f.emergency_exits_marked != null, required: false },
    { id: "lms", name: "LMS & Online Delivery", completed: (delivery === "BLENDED" || delivery === "MOBILE") ? !!f.lms_name?.trim() : true, required: delivery === "BLENDED" || delivery === "MOBILE" },
    { id: "wbl", name: "Workplace-Based Learning", completed: !!f.wbl_workplace_partner_name?.trim(), required: false },
    { id: "policies", name: "Policies & Procedures", completed: !!f.policies_procedures_notes?.trim(), required: false },
    { id: "facilitators", name: "Human Resources (Facilitators)", completed: !!f.facilitators_notes?.trim(), required: false },
  ];
  const completedCount = sections.filter((s) => s.completed).length;
  const requiredSections = sections.filter((s) => s.required);
  const requiredCompleted = requiredSections.filter((s) => s.completed).length;
  const allRequiredComplete = requiredSections.length === 0 || requiredSections.length === requiredCompleted;
  const completionPercentage = Math.round((completedCount / sections.length) * 100);
  return { sections, completedCount, requiredSections, requiredCompleted, allRequiredComplete, completionPercentage };
}

interface ReadinessFormFullPageProps {
  readiness: Readiness;
}

export function ReadinessFormFullPage({ readiness }: ReadinessFormFullPageProps) {
  const router = useRouter();
  const r = readiness as any;
  const [formData, setFormData] = useState({
    qualification_title: readiness.qualification_title || "",
    saqa_id: readiness.saqa_id || "",
    nqf_level: readiness.nqf_level?.toString() || "",
    curriculum_code: readiness.curriculum_code || "",
    delivery_mode: (readiness.delivery_mode || "FACE_TO_FACE") as DeliveryMode,
    readiness_status: (readiness.readiness_status || "NOT_STARTED") as ReadinessStatus,
    self_assessment_completed: r?.self_assessment_completed ?? null,
    self_assessment_remarks: r?.self_assessment_remarks || "",
    registration_type: r?.registration_type || "",
    professional_body_registration: r?.professional_body_registration ?? null,
    training_site_address: r?.training_site_address || "",
    ownership_type: r?.ownership_type || "",
    number_of_training_rooms: r?.number_of_training_rooms?.toString() || "",
    room_capacity: r?.room_capacity?.toString() || "",
    facilitator_learner_ratio: r?.facilitator_learner_ratio || "",
    learning_material_exists: r?.learning_material_exists ?? null,
    knowledge_module_coverage: r?.knowledge_module_coverage?.toString() || "",
    practical_module_coverage: r?.practical_module_coverage?.toString() || "",
    curriculum_alignment_confirmed: r?.curriculum_alignment_confirmed ?? null,
    fire_extinguisher_available: r?.fire_extinguisher_available ?? null,
    fire_extinguisher_service_date: r?.fire_extinguisher_service_date ? new Date(r.fire_extinguisher_service_date).toISOString().split("T")[0] : "",
    emergency_exits_marked: r?.emergency_exits_marked ?? null,
    accessibility_for_disabilities: r?.accessibility_for_disabilities ?? null,
    first_aid_kit_available: r?.first_aid_kit_available ?? null,
    ohs_representative_name: r?.ohs_representative_name || "",
    lms_name: r?.lms_name || "",
    max_learner_capacity: r?.max_learner_capacity?.toString() || "",
    internet_connectivity_method: r?.internet_connectivity_method || "",
    isp: r?.isp || "",
    backup_frequency: r?.backup_frequency || "",
    data_storage_description: r?.data_storage_description || "",
    security_measures_description: r?.security_measures_description || "",
    wbl_workplace_partner_name: r?.wbl_workplace_partner_name || "",
    wbl_agreement_type: r?.wbl_agreement_type || "",
    wbl_agreement_duration: r?.wbl_agreement_duration || "",
    wbl_components_covered: r?.wbl_components_covered || "",
    wbl_learner_support_description: r?.wbl_learner_support_description || "",
    wbl_assessment_responsibility: r?.wbl_assessment_responsibility || "",
    policies_procedures_notes: r?.policies_procedures_notes || "",
    facilitators_notes: r?.facilitators_notes || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [reviewOpen, setReviewOpen] = useState(false);
  const formDataRef = useRef(formData);
  const didMountRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  formDataRef.current = formData;

  const buildUpdatePayload = useCallback((f: any) => {
    const u: Record<string, unknown> = {
      qualification_title: f.qualification_title?.trim() || undefined,
      saqa_id: f.saqa_id?.trim() || undefined,
      curriculum_code: f.curriculum_code?.trim() || undefined,
      delivery_mode: f.delivery_mode || undefined,
      self_assessment_completed: f.self_assessment_completed !== null ? f.self_assessment_completed : undefined,
      self_assessment_remarks: f.self_assessment_remarks?.trim() || null,
      registration_type: f.registration_type?.trim() || null,
      professional_body_registration: f.professional_body_registration !== null ? f.professional_body_registration : undefined,
      training_site_address: f.training_site_address?.trim() || null,
      ownership_type: f.ownership_type?.trim() || null,
      number_of_training_rooms: f.number_of_training_rooms ? parseInt(f.number_of_training_rooms, 10) : null,
      room_capacity: f.room_capacity ? parseInt(f.room_capacity, 10) : null,
      facilitator_learner_ratio: f.facilitator_learner_ratio?.trim() || null,
      learning_material_exists: f.learning_material_exists !== null ? f.learning_material_exists : undefined,
      knowledge_module_coverage: f.knowledge_module_coverage ? Math.min(100, Math.max(0, parseInt(f.knowledge_module_coverage, 10))) : null,
      practical_module_coverage: f.practical_module_coverage ? Math.min(100, Math.max(0, parseInt(f.practical_module_coverage, 10))) : null,
      curriculum_alignment_confirmed: f.curriculum_alignment_confirmed !== null ? f.curriculum_alignment_confirmed : undefined,
      fire_extinguisher_available: f.fire_extinguisher_available !== null ? f.fire_extinguisher_available : undefined,
      fire_extinguisher_service_date: f.fire_extinguisher_service_date || null,
      emergency_exits_marked: f.emergency_exits_marked !== null ? f.emergency_exits_marked : undefined,
      accessibility_for_disabilities: f.accessibility_for_disabilities !== null ? f.accessibility_for_disabilities : undefined,
      first_aid_kit_available: f.first_aid_kit_available !== null ? f.first_aid_kit_available : undefined,
      ohs_representative_name: f.ohs_representative_name?.trim() || null,
      lms_name: f.lms_name?.trim() || null,
      max_learner_capacity: f.max_learner_capacity ? parseInt(f.max_learner_capacity, 10) : null,
      internet_connectivity_method: f.internet_connectivity_method?.trim() || null,
      isp: f.isp?.trim() || null,
      backup_frequency: f.backup_frequency?.trim() || null,
      data_storage_description: f.data_storage_description?.trim() || null,
      security_measures_description: f.security_measures_description?.trim() || null,
      wbl_workplace_partner_name: f.wbl_workplace_partner_name?.trim() || null,
      wbl_agreement_type: f.wbl_agreement_type?.trim() || null,
      wbl_agreement_duration: f.wbl_agreement_duration?.trim() || null,
      wbl_components_covered: f.wbl_components_covered?.trim() || null,
      wbl_learner_support_description: f.wbl_learner_support_description?.trim() || null,
      wbl_assessment_responsibility: f.wbl_assessment_responsibility?.trim() || null,
      policies_procedures_notes: f.policies_procedures_notes?.trim() || null,
      facilitators_notes: f.facilitators_notes?.trim() || null,
    };
    if (f.nqf_level) {
      const n = parseInt(f.nqf_level, 10);
      if (!isNaN(n)) u.nqf_level = n;
    }
    return u;
  }, []);

  const runAutosave = useCallback(async () => {
    const payload = buildUpdatePayload(formDataRef.current);
    if (Object.keys(payload).length === 0) return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/institutions/readiness/${readiness.readiness_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save");
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e: unknown) {
      setSaveStatus("error");
      toast.error(e instanceof Error ? e.message : "Error saving");
    }
  }, [buildUpdatePayload, readiness.readiness_id]);

  const canSubmit = readiness.readiness_status === "NOT_STARTED" || readiness.readiness_status === "IN_PROGRESS";

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!canSubmit) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      runAutosave();
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData, runAutosave, canSubmit]);

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/institutions/readiness/${readiness.readiness_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readiness_status: "SUBMITTED" }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit readiness record");
      }
      setReviewOpen(false);
      setSuccess(true);
      toast.success("Readiness record submitted for QCTO review!");
      setTimeout(() => router.refresh(), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while submitting the readiness record";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatStatus = (s: string) => s.replace(/_/g, " ");
  const statusBadge =
    readiness.readiness_status === "NOT_STARTED"
      ? "bg-slate-100 text-slate-700 border-slate-200"
      : readiness.readiness_status === "IN_PROGRESS"
        ? "bg-amber-500/12 text-amber-700 border-amber-200/60"
        : "bg-blue-500/12 text-blue-700 border-blue-200/60";

  return (
    <div className="space-y-6">
      {/* Top bar: gradient, back, title, status, save */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-4 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_50%)]" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/institution/readiness">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 hover:text-white border border-white/30">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Readiness Records
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <FileCheck className="h-5 w-5 text-white" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Form 5 Readiness — {formData.qualification_title || "Edit"}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold", statusBadge)}>
                    {formatStatus(readiness.readiness_status)}
                  </span>
                  {saveStatus === "saving" && <span className="text-xs text-amber-200">Saving…</span>}
                  {saveStatus === "saved" && <span className="text-xs text-emerald-200 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Saved</span>}
                  {saveStatus === "error" && <span className="text-xs text-red-200">Error saving</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Two-column: form (with dot pattern) | sidebar */}
      <div className="grid xl:grid-cols-[minmax(0,1fr),340px] gap-6 xl:gap-8">
        {/* Form panel: dot pattern + gradient, progress, step content, buttons */}
        <div className="readiness-form-pattern relative rounded-2xl border border-gray-200/80 bg-gradient-to-b from-sky-50/90 to-white p-6 shadow-sm">
          <div className="relative z-10 space-y-6">
            {/* Progress */}
            <div className="rounded-xl border border-blue-200/60 bg-white/80 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-800">Step {step} of {totalSteps}: {STEP_TITLES[step - 1]}</span>
              </div>
              <div className="flex gap-1" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${step} of ${totalSteps}`}>
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStep(s)}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-colors",
                      s < step ? "bg-blue-500" : s === step ? "bg-blue-500 ring-2 ring-blue-400/60 ring-offset-2" : "bg-gray-200"
                    )}
                    aria-label={`Go to step ${s}: ${STEP_TITLES[s - 1]}`}
                    aria-current={s === step ? "step" : undefined}
                  />
                ))}
              </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <ReadinessFormStepContent step={step} formData={formData as Record<string, unknown>} setFormData={setFormData as (v: Record<string, unknown> | ((p: Record<string, unknown>) => Record<string, unknown>)) => void} />

              {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                  <span className="font-medium">Error:</span> {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 text-green-800 p-4 text-sm">
                  <span className="font-medium">Success:</span> Readiness record submitted for QCTO review!
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                )}
                {step < totalSteps && (
                  <Button type="button" onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {step === totalSteps && canSubmit && (
                  <Button type="button" disabled={isSubmitting || readiness.readiness_status === "SUBMITTED"} onClick={() => setReviewOpen(true)}>
                    Review & Submit
                  </Button>
                )}
              </div>
              {!canSubmit && (
                <p className="text-sm text-muted-foreground">This readiness record cannot be edited in its current status ({formatStatus(readiness.readiness_status)}).</p>
              )}
            </form>
          </div>
        </div>

        {/* Sidebar: tips, suggestions, best practices */}
        <aside className="xl:sticky xl:top-24 self-start">
          <ReadinessFormSidebar step={step} />
        </aside>
      </div>

      {/* Review & Submit dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Review & Submit for QCTO</DialogTitle>
            <DialogDescription>Review your information and readiness score before submitting for QCTO review.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[45vh] min-h-[200px] px-6">
            {(() => {
              const { sections, completedCount, completionPercentage, allRequiredComplete } = getCompletionFromFormData(formData);
              return (
                <div className="space-y-5 pr-4 pb-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Readiness score</span>
                      <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${completionPercentage}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{completedCount} of {sections.length} sections completed</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                    <h4 className="text-sm font-semibold">Key details</h4>
                    <dl className="grid gap-2 text-sm">
                      <div><dt className="text-muted-foreground">Qualification</dt><dd className="font-medium">{formData.qualification_title || "—"}</dd></div>
                      <div><dt className="text-muted-foreground">SAQA ID</dt><dd className="font-mono">{formData.saqa_id || "—"}</dd></div>
                      <div><dt className="text-muted-foreground">Curriculum code</dt><dd className="font-mono">{formData.curriculum_code || "—"}</dd></div>
                      <div><dt className="text-muted-foreground">Delivery mode</dt><dd>{String(formData.delivery_mode || "—").replace(/_/g, " ")}</dd></div>
                    </dl>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                    <h4 className="text-sm font-semibold">Section status</h4>
                    <div className="grid gap-2">
                      {sections.map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-1.5 px-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm">{s.name}</span>
                          <div className="flex items-center gap-2">
                            {s.required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
                            <Badge variant={s.completed ? "default" : "secondary"} className="gap-1 text-xs">
                              {s.completed ? <><Check className="h-3 w-3" /> Complete</> : "Incomplete"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {!allRequiredComplete && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">Some required sections are incomplete</p>
                        <p className="text-amber-700 mt-0.5">You can still submit, but consider completing them for a smoother review.</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </ScrollArea>
          <DialogFooter className="p-6 pt-4 border-t flex-row justify-between sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setReviewOpen(false)} disabled={isSubmitting}>
              Back to form
            </Button>
            <Button type="button" onClick={handleSubmitForReview} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : "Submit for QCTO Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

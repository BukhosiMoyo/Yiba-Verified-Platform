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
import { Loader2, ChevronLeft, ChevronRight, Check, AlertTriangle, FileCheck, ArrowLeft, FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReadinessFormStepContent } from "@/components/institution/ReadinessFormStepContent";
import { ReadinessFormHelper } from "@/components/institution/ReadinessFormHelper";
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
const DEBOUNCE_MS = 2000; // 2 seconds - increased to reduce API calls and prevent errors

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
    qualification_registry_id: (readiness as any).qualification_registry_id ?? null as string | null,
    qualification_title: readiness.qualification_title || "",
    saqa_id: readiness.saqa_id || "",
    nqf_level: readiness.nqf_level?.toString() || "",
    curriculum_code: readiness.curriculum_code || "",
    credits: readiness.credits?.toString() || "",
    occupational_category: readiness.occupational_category || "",
    intended_learner_intake: readiness.intended_learner_intake?.toString() || "",
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
    facilitators: (() => {
      const facs = r?.facilitators || [];
      return JSON.stringify(
        facs.map((f: any) => ({
          id: f.facilitator_id,
          userId: f.user_id || undefined,
          fullName: `${f.first_name || ""} ${f.last_name || ""}`.trim(),
          idNumber: f.id_number || "",
          email: f.user?.email || "",
          phone: "",
          roles: ["FACILITATOR"],
          qualifications: f.qualifications || "",
          industryExperience: f.industry_experience || "",
          yearsExperience: "",
          certifications: "",
        }))
      );
    })(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>((readiness as any).documents || []);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const formDataRef = useRef(formData);
  const didMountRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPayloadRef = useRef<string>("");
  const autosaveInProgressRef = useRef(false);
  formDataRef.current = formData;

  // Fetch documents for this readiness record
  const fetchDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const res = await fetch(`/api/institutions/readiness/${readiness.readiness_id}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  }, [readiness.readiness_id]);

  const buildUpdatePayload = useCallback((f: any) => {
    const u: Record<string, unknown> = {};
    
    if (f.qualification_registry_id !== undefined) u.qualification_registry_id = f.qualification_registry_id || null;
    if (f.qualification_title?.trim()) u.qualification_title = f.qualification_title.trim();
    if (f.saqa_id?.trim()) u.saqa_id = f.saqa_id.trim();
    if (f.curriculum_code?.trim()) u.curriculum_code = f.curriculum_code.trim();
    if (f.credits) {
      const credits = parseInt(f.credits, 10);
      if (!isNaN(credits)) u.credits = credits;
    }
    if (f.occupational_category?.trim()) u.occupational_category = f.occupational_category.trim();
    if (f.intended_learner_intake) {
      const intake = parseInt(f.intended_learner_intake, 10);
      if (!isNaN(intake)) u.intended_learner_intake = intake;
    }
    if (f.delivery_mode) u.delivery_mode = f.delivery_mode;
    if (f.self_assessment_completed !== null && f.self_assessment_completed !== undefined) {
      u.self_assessment_completed = f.self_assessment_completed;
    }
    if (f.self_assessment_remarks?.trim()) u.self_assessment_remarks = f.self_assessment_remarks.trim();
    if (f.registration_type?.trim()) u.registration_type = f.registration_type.trim();
    if (f.professional_body_registration !== null && f.professional_body_registration !== undefined) {
      u.professional_body_registration = f.professional_body_registration;
    }
    if (f.training_site_address?.trim()) u.training_site_address = f.training_site_address.trim();
    if (f.ownership_type?.trim()) u.ownership_type = f.ownership_type.trim();
    if (f.number_of_training_rooms) {
      const rooms = parseInt(f.number_of_training_rooms, 10);
      if (!isNaN(rooms)) u.number_of_training_rooms = rooms;
    }
    if (f.room_capacity) {
      const capacity = parseInt(f.room_capacity, 10);
      if (!isNaN(capacity)) u.room_capacity = capacity;
    }
    if (f.facilitator_learner_ratio?.trim()) u.facilitator_learner_ratio = f.facilitator_learner_ratio.trim();
    if (f.learning_material_exists !== null && f.learning_material_exists !== undefined) {
      u.learning_material_exists = f.learning_material_exists;
    }
    if (f.knowledge_module_coverage) {
      const coverage = Math.min(100, Math.max(0, parseInt(f.knowledge_module_coverage, 10)));
      if (!isNaN(coverage)) u.knowledge_module_coverage = coverage;
    }
    if (f.practical_module_coverage) {
      const coverage = Math.min(100, Math.max(0, parseInt(f.practical_module_coverage, 10)));
      if (!isNaN(coverage)) u.practical_module_coverage = coverage;
    }
    if (f.curriculum_alignment_confirmed !== null && f.curriculum_alignment_confirmed !== undefined) {
      u.curriculum_alignment_confirmed = f.curriculum_alignment_confirmed;
    }
    if (f.fire_extinguisher_available !== null && f.fire_extinguisher_available !== undefined) {
      u.fire_extinguisher_available = f.fire_extinguisher_available;
    }
    if (f.fire_extinguisher_service_date) u.fire_extinguisher_service_date = f.fire_extinguisher_service_date;
    if (f.emergency_exits_marked !== null && f.emergency_exits_marked !== undefined) {
      u.emergency_exits_marked = f.emergency_exits_marked;
    }
    if (f.accessibility_for_disabilities !== null && f.accessibility_for_disabilities !== undefined) {
      u.accessibility_for_disabilities = f.accessibility_for_disabilities;
    }
    if (f.first_aid_kit_available !== null && f.first_aid_kit_available !== undefined) {
      u.first_aid_kit_available = f.first_aid_kit_available;
    }
    if (f.ohs_representative_name?.trim()) u.ohs_representative_name = f.ohs_representative_name.trim();
    if (f.lms_name?.trim()) u.lms_name = f.lms_name.trim();
    if (f.max_learner_capacity) {
      const capacity = parseInt(f.max_learner_capacity, 10);
      if (!isNaN(capacity)) u.max_learner_capacity = capacity;
    }
    if (f.internet_connectivity_method?.trim()) u.internet_connectivity_method = f.internet_connectivity_method.trim();
    if (f.isp?.trim()) u.isp = f.isp.trim();
    if (f.backup_frequency?.trim()) u.backup_frequency = f.backup_frequency.trim();
    if (f.data_storage_description?.trim()) u.data_storage_description = f.data_storage_description.trim();
    if (f.security_measures_description?.trim()) u.security_measures_description = f.security_measures_description.trim();
    if (f.wbl_workplace_partner_name?.trim()) u.wbl_workplace_partner_name = f.wbl_workplace_partner_name.trim();
    if (f.wbl_agreement_type?.trim()) u.wbl_agreement_type = f.wbl_agreement_type.trim();
    if (f.wbl_agreement_duration?.trim()) u.wbl_agreement_duration = f.wbl_agreement_duration.trim();
    if (f.wbl_components_covered?.trim()) u.wbl_components_covered = f.wbl_components_covered.trim();
    if (f.wbl_learner_support_description?.trim()) u.wbl_learner_support_description = f.wbl_learner_support_description.trim();
    if (f.wbl_assessment_responsibility?.trim()) u.wbl_assessment_responsibility = f.wbl_assessment_responsibility.trim();
    if (f.policies_procedures_notes?.trim()) u.policies_procedures_notes = f.policies_procedures_notes.trim();
    if (f.facilitators_notes?.trim()) u.facilitators_notes = f.facilitators_notes.trim();
    if (f.nqf_level) {
      const n = parseInt(f.nqf_level, 10);
      if (!isNaN(n)) u.nqf_level = n;
    }
    
    // Remove undefined values
    Object.keys(u).forEach(key => {
      if (u[key] === undefined) delete u[key];
    });
    
    return u;
  }, []);

  const runAutosave = useCallback(async () => {
    // Prevent multiple simultaneous autosaves
    if (autosaveInProgressRef.current) {
      return;
    }
    
    const payload = buildUpdatePayload(formDataRef.current);
    if (Object.keys(payload).length === 0) {
      setSaveStatus("idle");
      return;
    }
    
    // Validate payload before sending
    const payloadString = JSON.stringify(payload);
    if (!payloadString || payloadString === "{}") {
      setSaveStatus("idle");
      return;
    }
    
    // Skip if payload hasn't changed since last save
    if (payloadString === lastSavedPayloadRef.current) {
      setSaveStatus("idle");
      return;
    }
    
    autosaveInProgressRef.current = true;
    setSaveStatus("saving");
    
    try {

      const res = await fetch(`/api/institutions/readiness/${readiness.readiness_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: payloadString,
      }).catch((networkError) => {
        // Handle network errors (Safari-specific issues, CORS, etc.)
        console.error("Network error during autosave:", networkError);
        throw new Error(`Network error: ${networkError instanceof Error ? networkError.message : "Failed to connect to server"}`);
      });
      
      // Check if response is ok
      if (!res.ok) {
        let errorMessage = `Failed to save (${res.status} ${res.statusText})`;
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const d = await res.json();
            errorMessage = d.error || d.message || errorMessage;
          } else {
            const text = await res.text();
            if (text) {
              errorMessage = text.length > 200 ? text.substring(0, 200) + "..." : text;
            }
          }
        } catch (parseError) {
          // If parsing fails, use status-based message
          errorMessage = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Try to parse response (optional - response might be empty)
      try {
        await res.json();
      } catch (parseError) {
        // Response might be empty, that's okay - 200 status means success
      }
      
      // Mark payload as saved
      lastSavedPayloadRef.current = payloadString;
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e: unknown) {
      setSaveStatus("error");
      let errorMessage = "Error saving";
      
      // Better error extraction for Safari
      if (e instanceof Error) {
        errorMessage = e.message || e.name || errorMessage;
      } else if (typeof e === "string") {
        errorMessage = e;
      } else if (e && typeof e === "object") {
        // Try multiple ways to extract error message
        const errorObj = e as any;
        errorMessage = 
          errorObj.message || 
          errorObj.error || 
          errorObj.reason ||
          (errorObj.toString && errorObj.toString() !== "[object Object]" ? errorObj.toString() : null) ||
          JSON.stringify(errorObj).substring(0, 100) ||
          errorMessage;
      }
      
      // Only log and show error if it's not a network timeout or abort
      const isNetworkError = errorMessage.includes("Network") || 
                            errorMessage.includes("Failed to fetch") ||
                            errorMessage.includes("aborted");
      
      if (!isNetworkError) {
        console.error("Autosave error:", {
          error: e,
          errorType: typeof e,
          errorString: String(e),
          errorConstructor: e?.constructor?.name,
          errorJSON: JSON.stringify(e, Object.getOwnPropertyNames(e), 2),
          message: errorMessage,
          payload: payload,
          payloadKeys: Object.keys(payload),
          readinessId: readiness.readiness_id,
        });
        toast.error(errorMessage);
      } else {
        // For network errors, just log silently and reset status
        console.warn("Autosave network error (silent):", errorMessage);
      }
      
      // Reset error status after showing error
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      autosaveInProgressRef.current = false;
    }
  }, [buildUpdatePayload, readiness.readiness_id]);

  const canSubmit = readiness.readiness_status === "NOT_STARTED" || readiness.readiness_status === "IN_PROGRESS";
  const isSubmitted = readiness.readiness_status === "SUBMITTED" || 
                      readiness.readiness_status === "UNDER_REVIEW" || 
                      readiness.readiness_status === "RETURNED_FOR_CORRECTION" ||
                      readiness.readiness_status === "REVIEWED" ||
                      readiness.readiness_status === "RECOMMENDED" ||
                      readiness.readiness_status === "REJECTED";
  
  // Qualification context fields are immutable after submission
  const qualificationFieldsLocked = isSubmitted;

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
      // Validate readiness record before submission
      const validationResponse = await fetch(
        `/api/institutions/readiness/${readiness.readiness_id}/validate-submission`
      );
      if (!validationResponse.ok) {
        const validationData = await validationResponse.json();
        throw new Error(validationData.error || "Validation failed");
      }
      const validation = await validationResponse.json();

      if (!validation.can_submit) {
        // Show validation errors
        const errorMessages = validation.errors || [];
        const warningMessages = validation.warnings || [];
        
        if (errorMessages.length > 0) {
          setError(
            `Cannot submit: ${errorMessages.join(" ")}${warningMessages.length > 0 ? `\n\nWarnings: ${warningMessages.join(" ")}` : ""}`
          );
          toast.error("Submission validation failed. Please fix the errors before submitting.");
          setIsSubmitting(false);
          return;
        }
        
        // Show warnings but allow submission
        if (warningMessages.length > 0) {
          toast.warning(`Warnings: ${warningMessages.join(" ")}`);
        }
      }

      // Proceed with submission
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
      ? "bg-muted text-muted-foreground border-border"
      : readiness.readiness_status === "IN_PROGRESS"
        ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800"
        : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800";

  return (
    <div className="relative min-h-screen">
      {/* Background pattern - behind all content */}
      <div className="readiness-page-pattern" aria-hidden="true" />
      
      <div className="relative z-10 space-y-6">
      {/* Top bar: clean card design */}
      <header className="rounded-2xl border border-border bg-card px-6 py-5 shadow-sm dark:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20">
              <FileCheck className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Form 5 Readiness — {formData.qualification_title || "Edit"}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold", statusBadge)}>
                  {formatStatus(readiness.readiness_status)}
                </span>
                {saveStatus === "saving" && <span className="text-xs text-amber-600 dark:text-amber-400">Saving…</span>}
                {saveStatus === "saved" && <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Saved</span>}
                {saveStatus === "error" && <span className="text-xs text-destructive">Error saving</span>}
              </div>
            </div>
          </div>
          <Link href="/institution/readiness">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Readiness Records
            </Button>
          </Link>
        </div>
      </header>

      {/* Form and sidebar side by side: 4/6 form, 2/6 sidebar; items-start so sidebar height changes don't shift the form */}
      <div className="grid grid-cols-1 xl:grid-cols-[4fr_2fr] gap-6 xl:gap-8 items-start">
        {/* Form panel: clean card design — contain layout to prevent jitter when typing */}
        <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm dark:shadow-none [contain:layout]">
          <div className="relative z-10 space-y-6 min-h-[320px]">
            {/* Progress */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {step}
                  </span>
                  <span className="text-base font-semibold text-foreground">{STEP_TITLES[step - 1]}</span>
                </div>
                <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
              </div>
              <div className="flex gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${step} of ${totalSteps}`}>
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                  <div key={s} className="relative flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setStep(s)}
                      className={cn(
                        "relative h-2.5 w-full rounded-full transition-colors duration-200 hover:opacity-80",
                        s < step 
                          ? "bg-primary" 
                          : s === step 
                            ? "bg-primary shadow-sm shadow-primary/30 ring-2 ring-primary/30 ring-offset-2 ring-offset-card" 
                            : "bg-slate-300 dark:bg-slate-600"
                      )}
                      aria-label={`Go to step ${s}: ${STEP_TITLES[s - 1]}`}
                      aria-current={s === step ? "step" : undefined}
                    />
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <ReadinessFormStepContent 
                step={step} 
                formData={formData as Record<string, unknown>} 
                setFormData={setFormData as (v: Record<string, unknown> | ((p: Record<string, unknown>) => Record<string, unknown>)) => void}
                qualificationFieldsLocked={qualificationFieldsLocked}
                readinessId={readiness.readiness_id}
                institutionId={readiness.institution_id || undefined}
                canEdit={canSubmit}
              />

              {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                  <span className="font-medium">Error:</span> {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 p-4 text-sm">
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
                <p className="text-sm font-medium text-muted-foreground">This readiness record cannot be edited in its current status ({formatStatus(readiness.readiness_status)}).</p>
              )}
            </form>
          </div>
        </div>

        {/* Helper Sidebar: completion status and navigation - 2/6 width on desktop; min-height to avoid layout shift when content updates */}
        <aside className="min-h-[320px] [contain:layout]">
          <ReadinessFormHelper
            currentStep={step}
            formData={formData}
            readinessId={readiness.readiness_id}
            onStepClick={setStep}
          />
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
                  <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Readiness score</span>
                      <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${completionPercentage}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{completedCount} of {sections.length} sections completed</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Key details</h4>
                    <dl className="grid gap-2 text-sm">
                      <div><dt className="text-muted-foreground">Qualification</dt><dd className="font-medium text-foreground">{formData.qualification_title || "—"}</dd></div>
                      <div><dt className="text-muted-foreground">SAQA ID</dt><dd className="font-mono text-foreground">{formData.saqa_id || "—"}</dd></div>
                      <div><dt className="text-muted-foreground">Curriculum code</dt><dd className="font-mono text-foreground">{formData.curriculum_code || "—"}</dd></div>
                      <div><dt className="text-muted-foreground">Delivery mode</dt><dd className="text-foreground">{String(formData.delivery_mode || "—").replace(/_/g, " ")}</dd></div>
                    </dl>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Section status</h4>
                    <div className="grid gap-2">
                      {sections.map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-1.5 px-2 border-b border-border last:border-0">
                          <span className="text-sm text-foreground">{s.name}</span>
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
                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30 p-3 flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-300">Some required sections are incomplete</p>
                        <p className="text-amber-700 dark:text-amber-400 mt-0.5">You can still submit, but consider completing them for a smoother review.</p>
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
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllDocumentsForSection } from "@/lib/readinessDocumentTypes";

const DEBOUNCE_MS = 600;

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

interface SectionStatus {
  step: number;
  name: string;
  completed: boolean;
  documentsUploaded: number;
  documentsRequired: number;
  hasRequiredFields: boolean;
}

interface ReadinessFormHelperProps {
  currentStep: number;
  formData: Record<string, unknown>;
  readinessId: string;
  onStepClick: (step: number) => void;
}

/**
 * Helper Sidebar Component
 * 
 * Replaces the tips sidebar with a completion status helper that shows:
 * - Step-by-step completion status
 * - Document upload status per section
 * - Quick navigation to incomplete sections
 */
export function ReadinessFormHelper({
  currentStep,
  formData,
  readinessId,
  onStepClick,
}: ReadinessFormHelperProps) {
  const [sections, setSections] = useState<SectionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [debouncedFormData, setDebouncedFormData] = useState<Record<string, unknown>>(formData);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce formData so we don't recalculate on every keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedFormData(formData);
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData]);

  useEffect(() => {
    calculateCompletionStatus();
  }, [debouncedFormData, readinessId]);

  const calculateCompletionStatus = async () => {
    // Only show loading spinner on initial load; when we already have sections, update in place
    const isInitialLoad = sections.length === 0;
    if (isInitialLoad) setLoading(true);
    try {
      // Fetch documents to count per section
      const res = await fetch(`/api/institutions/readiness/${readinessId}`);
      const data = res.ok ? await res.json() : { documents: [] };
      const documents = data.documents || [];

      const sectionStatuses: SectionStatus[] = STEP_TITLES.map((name, index) => {
        const step = index + 1;
        const requiredDocs = getAllDocumentsForSection(step);
        // Filter documents by matching document types (since we don't have section_name in DB yet)
        const sectionDocs = documents.filter((doc: any) => {
          if (!doc.document_type) return false;
          const docType = doc.document_type.toUpperCase();
          return requiredDocs.some((reqType) => {
            const reqTypeUpper = reqType.toUpperCase().replace(/[^A-Z0-9]/g, "_");
            return docType.includes(reqTypeUpper) || reqTypeUpper.includes(docType);
          });
        });
        
        // Calculate field completion based on step requirements
        let hasRequiredFields = true;
        const fd = debouncedFormData as any;
        
        if (step === 1) {
          hasRequiredFields = !!(fd.qualification_title?.trim() && fd.saqa_id?.trim() && fd.curriculum_code?.trim() && fd.delivery_mode);
        } else if (step === 2) {
          hasRequiredFields = fd.self_assessment_completed != null;
        } else if (step === 3) {
          hasRequiredFields = !!(fd.registration_type?.trim() || fd.professional_body_registration != null);
        } else if (step === 4) {
          hasRequiredFields = !!fd.training_site_address?.trim();
        } else if (step === 5) {
          hasRequiredFields = fd.learning_material_exists != null;
        } else if (step === 6) {
          hasRequiredFields = fd.fire_extinguisher_available != null || fd.emergency_exits_marked != null;
        } else if (step === 7) {
          const delivery = fd.delivery_mode || "FACE_TO_FACE";
          hasRequiredFields = (delivery === "BLENDED" || delivery === "MOBILE") ? !!fd.lms_name?.trim() : true;
        } else if (step === 8) {
          hasRequiredFields = !!fd.wbl_workplace_partner_name?.trim();
        } else if (step === 9) {
          hasRequiredFields = !!fd.policies_procedures_notes?.trim();
        } else if (step === 10) {
          hasRequiredFields = !!fd.facilitators_notes?.trim();
        }

        // Section is complete if fields are filled AND required documents are uploaded
        const requiredDocCount = requiredDocs.filter((d) => !d.includes("(if applicable)") && !d.includes("optional")).length;
        const hasRequiredDocuments = requiredDocCount === 0 || sectionDocs.length >= requiredDocCount;

        return {
          step,
          name,
          completed: hasRequiredFields && hasRequiredDocuments,
          documentsUploaded: sectionDocs.length,
          documentsRequired: requiredDocCount,
          hasRequiredFields,
        };
      });

      setSections(sectionStatuses);
    } catch (error) {
      console.error("Failed to calculate completion status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (section: SectionStatus) => {
    if (section.completed) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
    if (!section.hasRequiredFields || (section.documentsRequired > 0 && section.documentsUploaded < section.documentsRequired)) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusColor = (section: SectionStatus) => {
    if (section.completed) {
      return "border-emerald-400/40 bg-emerald-500/10";
    }
    if (!section.hasRequiredFields || (section.documentsRequired > 0 && section.documentsUploaded < section.documentsRequired)) {
      return "border-amber-400/40 bg-amber-500/10";
    }
    return "border-border bg-muted/30";
  };

  if (loading) {
    return (
      <aside className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </aside>
    );
  }

  const incompleteSections = sections.filter((s) => !s.completed);
  const completedCount = sections.filter((s) => s.completed).length;

  return (
    <aside className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Form Completion</h3>
        <p className="text-xs text-muted-foreground">
          {completedCount} of {sections.length} sections complete
        </p>
      </div>

      <div className="space-y-2 min-h-[320px]">
        {sections.map((section) => (
          <button
            key={section.step}
            type="button"
            onClick={() => onStepClick(section.step)}
            className={cn(
              "w-full text-left rounded-lg border p-3 transition-all hover:shadow-sm",
              currentStep === section.step && "border-primary border-2 shadow-sm shadow-primary/20",
              getStatusColor(section)
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {getStatusIcon(section)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">
                      Step {section.step}: {section.name}
                    </p>
                    {currentStep === section.step && (
                      <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shrink-0">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {section.documentsRequired > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Documents: {section.documentsUploaded}/{section.documentsRequired}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No documents required</p>
                    )}
                    {!section.hasRequiredFields && (
                      <p className="text-xs text-amber-600 dark:text-amber-500">Missing required fields</p>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            </div>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs font-semibold text-foreground mb-2">Incomplete Sections</p>
        <div className="space-y-1 min-h-[2.5rem]">
          {incompleteSections.length > 0 ? (
            incompleteSections.map((section) => (
              <button
                key={section.step}
                type="button"
                onClick={() => onStepClick(section.step)}
                className="w-full text-left text-xs text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 hover:underline"
              >
                • {section.name}
              </button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">All sections complete</p>
          )}
        </div>
      </div>
    </aside>
  );
}

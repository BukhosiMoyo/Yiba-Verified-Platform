"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { StudentCVPreview } from "@/components/student/StudentCVPreview";
import { EditCVToolbar } from "./EditCVToolbar";
import { EditCVForm } from "./EditCVForm";
import { cn } from "@/lib/utils";
import type { MockStudentEditable, MockStudentSystem } from "@/components/student/StudentProfileClient";

export type EditCVLayoutProps = {
  cvId: string;
  cvName: string;
  initialEditable: MockStudentEditable;
  system: MockStudentSystem;
  targetRole: string;
  publicProfileId?: string | null;
  learnerId?: string;
  publicProfileEnabled?: boolean;
};

const AUTOSAVE_MS = 800;
const SAVED_DISPLAY_MS = 2000;

type SaveStatus = "idle" | "saving" | "saved";

/**
 * Full-screen Edit CV workspace. No AppShell.
 * Toolbar + form | live preview. Autosave to PATCH /api/student/profile/public.
 */
export function EditCVLayout({
  cvId,
  cvName,
  initialEditable,
  system,
  targetRole,
  publicProfileId,
  learnerId,
  publicProfileEnabled,
}: EditCVLayoutProps) {
  const [editable, setEditable] = useState<MockStudentEditable>(initialEditable);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [previewDark, setPreviewDark] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  const persist = useCallback(async () => {
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = null;
    }
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/student/profile/public", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_bio: editable.bio,
          public_skills: editable.skills,
          public_projects: editable.projects,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setSaveStatus("saved");
        savedTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), SAVED_DISPLAY_MS);
      } else {
        setSaveStatus("idle");
        toast.error("Failed to save");
      }
    } catch (e) {
      setSaveStatus("idle");
      toast.error("Failed to save");
    }
  }, [editable.bio, editable.skills, editable.projects]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(persist, AUTOSAVE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editable, persist]);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const triggerSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    persist();
  }, [persist]);

  const setBio = useCallback((v: string) => setEditable((e) => ({ ...e, bio: v })), []);
  const setSkills = useCallback((v: string[]) => setEditable((e) => ({ ...e, skills: v })), []);
  const setProjects = useCallback((v: MockStudentEditable["projects"]) => setEditable((e) => ({ ...e, projects: v })), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EditCVToolbar
        saveStatus={saveStatus}
        onManualSave={triggerSave}
        previewDark={previewDark}
        onPreviewThemeToggle={() => setPreviewDark((d) => !d)}
        publicProfileId={publicProfileId}
        learnerId={learnerId}
        publicProfileEnabled={publicProfileEnabled}
      />
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="flex flex-wrap gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200",
              viewMode === "edit" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200",
              viewMode === "preview" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Preview
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-6 mt-4">
          <div
            className={cn(
              viewMode === "preview" ? "block" : "hidden",
              "lg:block lg:col-span-4 lg:sticky lg:top-24 lg:self-start"
            )}
          >
            <div className={cn("rounded-lg overflow-hidden", previewDark && "dark")}>
              <StudentCVPreview
                editable={editable}
                system={system}
                targetRole={targetRole}
                variant="full"
              />
            </div>
          </div>
          <div className={cn(viewMode === "edit" ? "block" : "hidden", "lg:block lg:col-span-2")}>
            <EditCVForm
              editable={editable}
              onBioChange={setBio}
              onSkillsChange={setSkills}
              onProjectsChange={setProjects}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

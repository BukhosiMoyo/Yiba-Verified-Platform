"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FilePlus, ChevronLeft, ChevronRight } from "lucide-react";
import { StudentCVPreview } from "@/components/student/StudentCVPreview";
import { CVSwitcher } from "./CVSwitcher";
import { ProfileFloatingActions } from "./ProfileFloatingActions";
import { ProfileSidebar } from "./ProfileSidebar";
import { ShareProfileModal } from "./ShareProfileModal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { generateCvPdf } from "@/lib/cv-pdf";
import { cn } from "@/lib/utils";
import type { MockStudentEditable, MockStudentSystem } from "@/components/student/StudentProfileClient";
import type { CVVersionRow } from "@/components/student/StudentCVVersionsTable";

export type ProfileViewClientProps = {
  initialEditable: MockStudentEditable;
  system: MockStudentSystem;
  cvVersions: CVVersionRow[];
  learnerId?: string;
  publicProfileId?: string | null;
  publicProfileEnabled?: boolean;
};

export function ProfileViewClient({
  initialEditable,
  system,
  cvVersions,
  learnerId,
  publicProfileId,
  publicProfileEnabled,
}: ProfileViewClientProps) {
  const router = useRouter();
  const [editable, setEditable] = useState<MockStudentEditable>(initialEditable);
  const [publicProfile, setPublicProfile] = useState(publicProfileEnabled ?? false);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(cvVersions[0]?.id ?? null);
  const [pdfRequest, setPdfRequest] = useState<{ targetRole: string; versionName: string } | null>(null);
  const [verifyUrl, setVerifyUrl] = useState("yibaverified.co.za");
  const [isSavingPublic, setIsSavingPublic] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/student/profile/public");
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && data?.data) {
          setPublicProfile(!!data.data.public_profile_enabled);
          setEditable((prev) => ({
            ...prev,
            bio: data.data.public_bio ?? prev.bio,
            skills: data.data.public_skills ?? prev.skills,
            projects: data.data.public_projects ?? prev.projects,
          }));
        }
      } catch (e) {
        console.warn("Failed to load public profile settings", e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location?.origin) return;
    const id = publicProfileEnabled && publicProfileId ? publicProfileId : learnerId ?? "demo";
    setVerifyUrl(`${window.location.origin}/p/${id}`);
  }, [learnerId, publicProfileId, publicProfileEnabled]);

  const savePublicSettings = async (publicEnabledOverride?: boolean) => {
    const enabled = publicEnabledOverride ?? publicProfile;
    setIsSavingPublic(true);
    try {
      const res = await fetch("/api/student/profile/public", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_profile_enabled: enabled,
          public_bio: editable.bio,
          public_skills: editable.skills,
          public_projects: editable.projects,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setPublicProfile(enabled);
        toast.success("Public profile settings saved");
        if (data?.data?.public_profile_id && !publicProfileId) router.refresh();
      } else toast.error("Failed to save");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save");
    } finally {
      setIsSavingPublic(false);
    }
  };

  const handlePublicProfileChange = (checked: boolean) => {
    setPublicProfile(checked);
    savePublicSettings(checked);
  };

  const resolveTargetRoleAndVersion = (cvIdOrOptionId?: string) => {
    const first = cvVersions[0];
    const fallback = { targetRole: first?.targetRole ?? "—", versionName: first?.name ?? "CV" };
    if (!cvIdOrOptionId) return fallback;
    const row = cvVersions.find((r) => r.id === cvIdOrOptionId);
    if (row) return { targetRole: row.targetRole, versionName: row.name };
    return fallback;
  };

  const handleDownload = () => {
    const id = selectedCvId ?? cvVersions[0]?.id;
    const { targetRole, versionName } = resolveTargetRoleAndVersion(id ?? undefined);
    setPdfRequest({ targetRole, versionName });
  };

  useEffect(() => {
    if (!pdfRequest || !printRef.current) return;
    const el = printRef.current;
    const base = `${system.header.name} – ${pdfRequest.versionName} – Yiba Verified`;
    const raf = requestAnimationFrame(() => {
      generateCvPdf(el, { filename: base })
        .then(() => toast.success("PDF downloaded"))
        .catch((err) => {
          console.error("CV PDF error:", err);
          toast.error("Failed to generate PDF");
        })
        .finally(() => setPdfRequest(null));
    });
    return () => cancelAnimationFrame(raf);
  }, [pdfRequest, system.header.name]);

  const profileUrl =
    verifyUrl.startsWith("http")
      ? verifyUrl
      : typeof window !== "undefined" && window.location?.origin
        ? `${window.location.origin}/p/${publicProfileId || learnerId || "demo"}`
        : "";
  const handleShare = () => {
    if (!profileUrl) return;
    if (typeof window !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(profileUrl).then(() => toast.success("Public profile link copied"));
    }
  };

  const handleDeleteCv = (id: string) => {
    if (cvVersions.length <= 1) {
      toast.info("You need at least one CV. Delete is not available.");
      return;
    }
    toast.info("Delete not yet implemented.");
  };

  const handleCreateNewCv = () => {
    const primary = cvVersions.find((c) => c.id === "primary") ?? cvVersions[0];
    router.push(primary ? `/student/profile/edit/${primary.id}` : "/student/profile/edit/primary");
  };

  const selected = selectedCvId ?? cvVersions[0]?.id;
  const cv = selected ? cvVersions.find((c) => c.id === selected) : cvVersions[0];
  const targetRole = cv?.targetRole ?? cvVersions[0]?.targetRole ?? "—";
  const canDelete = cvVersions.length > 1;

  const cvIndex = selected ? cvVersions.findIndex((r) => r.id === selected) : 0;
  const canPrev = cvIndex > 0;
  const canNext = cvIndex >= 0 && cvIndex < cvVersions.length - 1;
  const goPrev = () => {
    if (!canPrev) return;
    setSelectedCvId(cvVersions[cvIndex - 1].id);
  };
  const goNext = () => {
    if (!canNext) return;
    setSelectedCvId(cvVersions[cvIndex + 1].id);
  };

  return (
    <>
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-[var(--border-strong)] ring-1 ring-primary/5"
        )}
      >
        <ProfileSidebar
          cvVersions={cvVersions}
          selectedCvId={selected}
          onSelectCv={(id) => setSelectedCvId(id)}
          onCreateCv={handleCreateNewCv}
          system={system}
          publicProfile={publicProfile}
          onCopyLink={handleShare}
          isSaving={isSavingPublic}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-strong)] bg-card/95 px-4 py-3 backdrop-blur-sm md:px-6">
            <CVSwitcher
              rows={cvVersions}
              selectedId={selected}
              onSelect={setSelectedCvId}
              showCreateButton={false}
            />
            <div className="flex items-center gap-4 ml-auto shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground whitespace-nowrap">Public profile</span>
                <Switch
                  checked={publicProfile}
                  onCheckedChange={handlePublicProfileChange}
                  disabled={isSavingPublic}
                  aria-label="Public profile"
                />
              </div>
              <Button variant="default" size="sm" className="gap-1.5 shrink-0" onClick={handleCreateNewCv}>
                <FilePlus className="h-4 w-4" strokeWidth={1.5} />
                Create New CV
              </Button>
            </div>
          </div>
          <div className="flex min-h-[60vh] flex-1 flex-col gap-4 p-4 md:p-6">
            <div className="flex min-h-0 flex-1 items-stretch gap-2">
              <div className="flex shrink-0 items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-[var(--border-strong)] hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-[var(--border-strong)] disabled:hover:text-muted-foreground"
                  onClick={goPrev}
                  disabled={!canPrev}
                  aria-label="Previous CV"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto max-w-2xl transition-opacity duration-200">
                  <StudentCVPreview
                    editable={editable}
                    system={system}
                    targetRole={targetRole}
                    variant="full"
                  />
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-[var(--border-strong)] hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-[var(--border-strong)] disabled:hover:text-muted-foreground"
                  onClick={goNext}
                  disabled={!canNext}
                  aria-label="Next CV"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
                </Button>
              </div>
              <div className="flex shrink-0 items-start pt-2">
                <ProfileFloatingActions
                  cvId={selected ?? "primary"}
                  onDownload={handleDownload}
                  onShare={() => setShareModalOpen(true)}
                  onDelete={handleDeleteCv}
                  canDelete={canDelete}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShareProfileModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        publicProfile={publicProfile}
        onPublicProfileChange={handlePublicProfileChange}
        profileUrl={profileUrl}
        onCopyLink={handleShare}
        isSaving={isSavingPublic}
      />

      <div
        ref={printRef}
        aria-hidden
        className="cv-pdf-print fixed -left-[9999px] top-0 z-[-1] w-[210mm] bg-[#fefdfb]"
        style={{ visibility: "visible" }}
      >
        <StudentCVPreview
          editable={editable}
          system={system}
          targetRole={pdfRequest?.targetRole ?? targetRole}
          variant="full"
        />
        <footer className="mt-4 border-t border-border pt-3 pb-2 text-center">
          <p className="text-[11px] font-semibold text-muted-foreground">Yiba Verified</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {verifyUrl.startsWith("http") ? `Verify at: ${verifyUrl}` : `Verify at ${verifyUrl}`}
          </p>
          {(pdfRequest?.versionName ?? cv?.name) && (
            <p className="text-[10px] text-muted-foreground/80 mt-1">
              — {pdfRequest?.versionName ?? cv?.name}
            </p>
          )}
        </footer>
      </div>
    </>
  );
}

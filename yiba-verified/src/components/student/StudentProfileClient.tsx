"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Lock, ChevronUp, ChevronDown, X, Pencil, Trash2, ExternalLink, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { StudentProfileHeader, type StudentProfileHeaderSystem } from "./StudentProfileHeader";
import { StudentCVVersionsTable, type CVVersionRow } from "./StudentCVVersionsTable";
import { StudentCVPreview } from "./StudentCVPreview";
import { cn } from "@/lib/utils";
import { generateCvPdf } from "@/lib/cv-pdf";
// ─── Editable by student (manual fields) ─────────────────────────────
// Stored in localStorage temporarily until database persistence is implemented
export type MockStudentEditable = {
  photoUrl: string | null;
  bio: string;
  skills: string[];
  projects: { id: string; title: string; description: string; link?: string }[];
};

// ─── Auto-populated from Yiba Verified (read-only) ───────────────────
// Fetched from database: learner/institution/qualifications/evidence
export type MockStudentSystem = {
  header: StudentProfileHeaderSystem;
  qualifications: { title: string; nqf: string; status: string }[];
  evidenceCounts: { qualifications: number; evidenceItems: number; readinessSubmissions: number };
  workplaceEvidence: { total: number; recent: { workplace: string; role: string; range: string }[] };
};

// LocalStorage key for editable profile data
const PROFILE_STORAGE_KEY = "student_profile_editable";

// Styles for locked (auto-filled) cards: subtle tint, works in light/dark
const LOCKED_CARD_CLASS = "bg-blue-50/40 dark:bg-blue-950/20 border-blue-100/60 dark:border-blue-900/30";

export type StudentProfileClientProps = {
  initialEditable: MockStudentEditable;
  system: MockStudentSystem;
  cvVersions: CVVersionRow[];
  learnerId?: string; // Optional: used for generating public profile links
  publicProfileId?: string | null; // Optional: public profile ID (unguessable)
  publicProfileEnabled?: boolean; // Optional: whether public profile is enabled
};

export function StudentProfileClient({ initialEditable, system, cvVersions, learnerId, publicProfileId, publicProfileEnabled }: StudentProfileClientProps) {
  // Initialize with public data from server (initialEditable contains public data)
  // Private data is stored separately in localStorage
  const [editable, setEditable] = useState<MockStudentEditable>(initialEditable);
  const [activeTab, setActiveTab] = useState("overview");
  const [publicProfile, setPublicProfile] = useState(publicProfileEnabled ?? false);
  const [hideContact, setHideContact] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [pdfRequest, setPdfRequest] = useState<{ targetRole: string; versionName: string } | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string>("yibaverified.co.za");
  const [isSavingPublic, setIsSavingPublic] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Load public profile settings on mount to ensure we have latest state
  useEffect(() => {
    const loadPublicSettings = async () => {
      try {
        const response = await fetch("/api/student/profile/public");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPublicProfile(data.data.public_profile_enabled || false);
            // Update editable with latest public data
            setEditable((prev) => ({
              ...prev,
              bio: data.data.public_bio || prev.bio,
              skills: data.data.public_skills || prev.skills,
              projects: data.data.public_projects || prev.projects,
            }));
          }
        }
      } catch (error) {
        console.error("Failed to load public profile settings:", error);
      }
    };
    loadPublicSettings();
  }, []);

  // Save private editable data to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(editable));
      } catch (e) {
        console.warn("Failed to save profile to localStorage", e);
      }
    }
  }, [editable]);

  // Save public profile settings to database
  const savePublicProfileSettings = async () => {
    setIsSavingPublic(true);
    try {
      const response = await fetch("/api/student/profile/public", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_profile_enabled: publicProfile,
          public_bio: editable.bio,
          public_skills: editable.skills,
          public_projects: editable.projects,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success("Public profile settings saved");
          // If enabling and no ID exists, it will be generated server-side
          if (data.data?.public_profile_id && !publicProfileId) {
            // Reload page to get new public_profile_id (or update via state)
            window.location.reload();
          }
        }
      } else {
        toast.error("Failed to save public profile settings");
      }
    } catch (error) {
      console.error("Failed to save public profile settings:", error);
      toast.error("Failed to save public profile settings");
    } finally {
      setIsSavingPublic(false);
    }
  };

  const setPhoto = (url: string | null) => setEditable((e) => ({ ...e, photoUrl: url }));
  const setBio = (bio: string) => setEditable((e) => ({ ...e, bio }));
  const setSkills = (skills: string[]) => setEditable((e) => ({ ...e, skills }));
  const setProjects = (projects: MockStudentEditable["projects"]) => setEditable((e) => ({ ...e, projects }));

  const resolveTargetRoleAndVersion = (cvIdOrOptionId?: string): { targetRole: string; versionName: string } => {
    const first = cvVersions[0];
    const fallback = { targetRole: first?.targetRole ?? "—", versionName: first?.name ?? "CV" };
    if (!cvIdOrOptionId) return fallback;
    const byRow = cvVersions.find((r) => r.id === cvIdOrOptionId);
    if (byRow) return { targetRole: byRow.targetRole, versionName: byRow.name };
    const opt = system.header.downloadCvOptions?.find((o) => o.id === cvIdOrOptionId);
    const byLabel = cvVersions.find((r) => r.name === opt?.label);
    if (byLabel) return { targetRole: byLabel.targetRole, versionName: byLabel.name };
    return { targetRole: first?.targetRole ?? "—", versionName: opt?.label ?? "CV" };
  };

  const handleDownloadCv = (optionOrRowId?: string) => {
    const { targetRole, versionName } = resolveTargetRoleAndVersion(optionOrRowId);
    setPdfRequest({ targetRole, versionName });
  };

  // Set verify URL on client side only to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      // Use public_profile_id if available and enabled, otherwise use learner_id
      const profileId = (publicProfileEnabled && publicProfileId) ? publicProfileId : (learnerId || "demo");
      setVerifyUrl(`${window.location.origin}/p/${profileId}`);
    } else {
      // Fallback to domain name (will be used on server and initial client render)
      setVerifyUrl("yibaverified.co.za");
    }
  }, [learnerId, publicProfileId, publicProfileEnabled]);

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

  const handleShareProfile = () => {
    // Use current origin if available, otherwise fallback to domain
    const origin = typeof window !== "undefined" && window.location?.origin 
      ? window.location.origin 
      : "https://yibaverified.co.za";
    // Use public_profile_id if available and enabled, otherwise use learner_id
    const profileId = (publicProfileEnabled && publicProfileId) ? publicProfileId : (learnerId || "demo");
    const url = `${origin}/p/${profileId}`;
    if (typeof window !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(url).then(() => toast.success("Public profile link copied"));
    }
  };

  const handleSharePrivateLink = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/student/profile` : "";
    if (url) void navigator.clipboard.writeText(url).then(() => toast.success("Private link copied (login required)"));
  };

  return (
    <div className="space-y-6 pb-8">
      <StudentProfileHeader
        photoUrl={editable.photoUrl}
        onPhotoChange={setPhoto}
        system={system.header}
        onDownloadCv={handleDownloadCv}
        onSharePublicLink={handleShareProfile}
        onSharePrivateLink={handleSharePrivateLink}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cv">CV Versions</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="workplace">Workplace Evidence</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Preview first in DOM so it stacks above on mobile; lg:col-span-3 so it dominates */}
            <div className="space-y-6 lg:col-span-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-2">Live CV Preview</h2>
                <p className="text-xs text-muted-foreground mb-3">
                  Changes to About, Skills, and Projects appear here as you edit.
                </p>
                <StudentCVPreview
                  editable={editable}
                  system={system}
                  targetRole={cvVersions[0]?.targetRole}
                  variant="compact"
                />
              </div>
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Verified Data (from Yiba Verified)</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    These details are populated from your verified records and can&apos;t be edited here.
                  </p>
                </div>
              </div>
              <VerificationCard system={system} locked />
              <QuickStatsCard system={system} locked />
              <QualificationsPreviewCard system={system} locked />
              <WorkplaceEvidencePreviewCard system={system} locked />
            </div>

            {/* Editable cards: lg:col-span-2 */}
            <div className="space-y-6 lg:col-span-2">
              <AboutCard 
                bio={editable.bio} 
                onBioChange={(bio) => {
                  setBio(bio);
                  // Auto-save to public profile if enabled
                  if (publicProfile) {
                    clearTimeout((window as any).publicBioSaveTimeout);
                    (window as any).publicBioSaveTimeout = setTimeout(() => savePublicProfileSettings(), 1000);
                  }
                }}
                isPublic={publicProfile}
              />
              <SkillsCard 
                skills={editable.skills} 
                onSkillsChange={(skills) => {
                  setSkills(skills);
                  // Auto-save to public profile if enabled
                  if (publicProfile) {
                    clearTimeout((window as any).publicSkillsSaveTimeout);
                    (window as any).publicSkillsSaveTimeout = setTimeout(() => savePublicProfileSettings(), 1000);
                  }
                }}
                isPublic={publicProfile}
              />
              <ProjectsCard 
                projects={editable.projects} 
                onProjectsChange={(projects) => {
                  setProjects(projects);
                  // Auto-save to public profile if enabled
                  if (publicProfile) {
                    clearTimeout((window as any).publicProjectsSaveTimeout);
                    (window as any).publicProjectsSaveTimeout = setTimeout(() => savePublicProfileSettings(), 1000);
                  }
                }}
                isPublic={publicProfile}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cv">
          <p className="text-sm text-muted-foreground mb-4">
            CV versions let you tailor your profile for different job roles while keeping your verified records consistent.
          </p>
          <div className="grid gap-6 xl:grid-cols-5">
            {/* Preview first in DOM so it stacks above on small screens; xl:col-span-3 so it dominates */}
            <div className="xl:col-span-3">
              <div className="xl:sticky xl:top-24">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Preview{selectedCvId ? `: ${cvVersions.find((c) => c.id === selectedCvId)?.name ?? "CV"}` : ""}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {selectedCvId
                    ? "Viewing this CV version. Select a row to switch."
                    : "Click a row or View to see that CV here."}
                </p>
                <StudentCVPreview
                  editable={editable}
                  system={system}
                  targetRole={
                    selectedCvId
                      ? cvVersions.find((c) => c.id === selectedCvId)?.targetRole
                      : cvVersions[0]?.targetRole
                  }
                  variant="full"
                />
              </div>
            </div>
            <div className="xl:col-span-2 space-y-4">
              <StudentCVVersionsTable
                rows={cvVersions}
                selectedId={selectedCvId}
                onSelect={setSelectedCvId}
                onDownloadCv={(id) => handleDownloadCv(id)}
                onShareProfile={() => handleShareProfile()}
                onDelete={(id) => toast.info("Delete is not yet implemented")}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>Credentials</CardTitle>
              <CardDescription>
                Qualifications and verified badges will appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="workplace">
          <Card>
            <CardHeader>
              <CardTitle>Workplace Evidence</CardTitle>
              <CardDescription>
                Logbook entries and confirmations will appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Uploaded documents will appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Profile visibility and privacy options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Public profile</p>
                  <p className="text-xs text-muted-foreground">
                    Allow anyone with the link to view your public profile. When enabled, your public bio, skills, and projects will be visible.
                  </p>
                  {publicProfile && publicProfileId && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      Public link: /p/{publicProfileId}
                    </p>
                  )}
                </div>
                <Switch 
                  checked={publicProfile} 
                  onCheckedChange={(checked) => {
                    setPublicProfile(checked);
                    // Auto-save when toggled
                    setTimeout(() => savePublicProfileSettings(), 100);
                  }}
                  disabled={isSavingPublic}
                />
              </div>
              {publicProfile && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">Public Profile Content</p>
                  <p className="text-xs text-muted-foreground">
                    The content below will be visible on your public profile. Changes are saved automatically.
                  </p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Public Bio</label>
                      <Textarea
                        value={editable.bio}
                        onChange={(e) => {
                          setEditable((prev) => ({ ...prev, bio: e.target.value }));
                          // Debounce save
                          clearTimeout((window as any).publicBioSaveTimeout);
                          (window as any).publicBioSaveTimeout = setTimeout(() => savePublicProfileSettings(), 1000);
                        }}
                        placeholder="Write a bio that will be visible on your public profile..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Hide contact details</p>
                  <p className="text-xs text-muted-foreground">Do not show email or phone on your public profile.</p>
                </div>
                <Switch checked={hideContact} onCheckedChange={setHideContact} />
              </div>
              <div className="pt-4 border-t">
                <Button
                  onClick={savePublicProfileSettings}
                  disabled={isSavingPublic}
                  size="sm"
                >
                  {isSavingPublic ? "Saving..." : "Save Public Profile Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dedicated print-only node for PDF: off-screen, always mounted; ref used by generateCvPdf */}
      <div
        ref={printRef}
        aria-hidden
        className="cv-pdf-print fixed -left-[9999px] top-0 z-[-1] w-[210mm] bg-[#fefdfb]"
        style={{ visibility: "visible" }}
      >
        <StudentCVPreview
          editable={editable}
          system={system}
          targetRole={pdfRequest?.targetRole ?? cvVersions[0]?.targetRole}
          variant="full"
        />
        <footer className="mt-4 border-t border-stone-200 dark:border-stone-700 pt-3 pb-2 text-center">
          <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">Yiba Verified</p>
          <p className="text-[10px] text-stone-500 dark:text-stone-500 mt-0.5">
            {verifyUrl.startsWith("http") ? `Verify at: ${verifyUrl}` : `Verify at ${verifyUrl}`}
          </p>
          {(pdfRequest?.versionName ?? cvVersions[0]?.name) && (
            <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-1">
              — {pdfRequest?.versionName ?? cvVersions[0]?.name}
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}

// ─── Editable: About ──────────────────────────────────────────────────────
function AboutCard({ bio, onBioChange, isPublic }: { bio: string; onBioChange: (v: string) => void; isPublic?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);

  const save = () => {
    onBioChange(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(bio);
    setEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">About</CardTitle>
        {isPublic && (
          <CardDescription className="text-xs">
            This content will be visible on your public profile
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
            <div className="flex gap-2">
              <Button size="sm" onClick={save}>Save</Button>
              <Button size="sm" variant="outline" onClick={cancel}>Cancel</Button>
            </div>
          </div>
        ) : bio ? (
          <>
            <p className="text-sm text-foreground leading-relaxed">{bio}</p>
            <Button variant="ghost" size="sm" className="mt-2 h-8" onClick={() => { setDraft(bio); setEditing(true); }}>
              <Pencil className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
              Edit
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <h4 className="text-sm font-medium text-foreground">Add a short bio</h4>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              A strong summary helps employers understand what you do best.
            </p>
            <Button variant="outline" size="sm" onClick={() => { setDraft(""); setEditing(true); }}>Add bio</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Editable: Skills ─────────────────────────────────────────────────────
function SkillsCard({ skills, onSkillsChange, isPublic }: { skills: string[]; onSkillsChange: (v: string[]) => void; isPublic?: boolean }) {
  const [input, setInput] = useState("");

  const add = () => {
    const s = input.trim();
    if (s && !skills.includes(s)) {
      onSkillsChange([...skills, s]);
      setInput("");
    }
  };

  const remove = (i: number) => onSkillsChange(skills.filter((_, j) => j !== i));

  const move = (i: number, dir: "up" | "down") => {
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= skills.length) return;
    const n = [...skills];
    [n[i], n[j]] = [n[j], n[i]];
    onSkillsChange(n);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Skills</CardTitle>
        {isPublic && (
          <CardDescription className="text-xs">
            These skills will be visible on your public profile
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No skills yet</p>
            <div className="flex justify-center gap-2 mt-3">
              <Input
                placeholder="Add a skill"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
                className="max-w-[200px] h-9"
              />
              <Button variant="outline" size="sm" onClick={add}>Add</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span
                  key={`${s}-${i}`}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium",
                    "border-border bg-muted text-foreground"
                  )}
                >
                  {s}
                  <div className="flex items-center gap-0.5 ml-0.5">
                    <button type="button" onClick={() => move(i, "up")} disabled={i === 0} className="p-0.5 rounded hover:bg-muted disabled:opacity-30" aria-label="Move up">
                      <ChevronUp className="h-3 w-3" strokeWidth={2} />
                    </button>
                    <button type="button" onClick={() => move(i, "down")} disabled={i === skills.length - 1} className="p-0.5 rounded hover:bg-muted disabled:opacity-30" aria-label="Move down">
                      <ChevronDown className="h-3 w-3" strokeWidth={2} />
                    </button>
                    <button type="button" onClick={() => remove(i)} className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30" aria-label="Remove">
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </div>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
                className="max-w-[200px] h-9"
              />
              <Button variant="outline" size="sm" onClick={add}>Add</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Editable: Projects ───────────────────────────────────────────────────
type Project = { id: string; title: string; description: string; link?: string };

function ProjectsCard({ projects, onProjectsChange, isPublic }: { projects: Project[]; onProjectsChange: (v: Project[]) => void; isPublic?: boolean }) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; link: string }>({ title: "", description: "", link: "" });

  const startAdd = () => {
    setForm({ title: "", description: "", link: "" });
    setEditingId("new");
  };

  const startEdit = (p: Project) => {
    setForm({ title: p.title, description: p.description, link: p.link ?? "" });
    setEditingId(p.id);
  };

  const save = () => {
    if (editingId === "new") {
      onProjectsChange([...projects, { id: "p-" + Date.now(), title: form.title, description: form.description, link: form.link || undefined }]);
    } else if (editingId) {
      onProjectsChange(projects.map((p) => (p.id === editingId ? { ...p, ...form, link: form.link || undefined } : p)));
    }
    setEditingId(null);
  };

  const remove = (id: string) => onProjectsChange(projects.filter((p) => p.id !== id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Projects</CardTitle>
        {isPublic && (
          <CardDescription className="text-xs">
            These projects will be visible on your public profile
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.length === 0 && !editingId && (
          <div className="text-center py-6">
            <h4 className="text-sm font-medium text-foreground">Show what you&apos;ve built</h4>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Add projects to help employers see your real work.
            </p>
            <Button variant="outline" size="sm" onClick={startAdd}>
              <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
              Add project
            </Button>
          </div>
        )}

        {(projects.length > 0 || editingId) && (
          <ul className="space-y-4">
            {editingId === "new" && (
              <li className="p-3 rounded-lg border border-border space-y-2">
                <Input placeholder="Project title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                <Textarea placeholder="Short description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
                <Input placeholder="Link (optional)" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={save}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </li>
            )}
            {projects.map((p) =>
              editingId === p.id ? (
                <li key={p.id} className="p-3 rounded-lg border border-border space-y-2">
                  <Input placeholder="Project title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                  <Textarea placeholder="Short description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
                  <Input placeholder="Link (optional)" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={save}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </li>
              ) : (
                <li key={p.id} className="flex items-start justify-between gap-2 p-3 rounded-lg border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                        View link
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-8" onClick={() => startEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                    <Button variant="destructive" size="sm" className="h-8" onClick={() => remove(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}

        {projects.length > 0 && !editingId && (
          <Button variant="outline" size="sm" onClick={startAdd}>
            <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
            Add project
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Locked card wrapper: tint + Lock icon + Auto-filled badge ─────────────
function LockedCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn(LOCKED_CARD_CLASS, "border", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Lock className="h-4 w-4 text-muted-foreground dark:text-gray-400 shrink-0" strokeWidth={1.5} />
          <CardTitle className="text-lg dark:text-gray-100">{title}</CardTitle>
          <Badge variant="secondary" className="text-xs dark:bg-gray-700/50 dark:text-gray-300">Auto-filled</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

// ─── Locked: Verification ─────────────────────────────────────────────────
function VerificationCard({ system, locked }: { system: MockStudentSystem; locked?: boolean }) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground dark:text-gray-400">Status</span>
        <Badge variant="success" className="dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50">{system.header.verifiedStatus}</Badge>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">Verified by: {system.header.verifiedBy}</p>
      <p className="text-xs text-muted-foreground dark:text-gray-500">Aligned with QCTO</p>
    </>
  );
  if (locked) return <LockedCard title="Verification">{inner}</LockedCard>;
  return (
    <Card className="dark:border-gray-700/60 dark:bg-gray-900/50">
      <CardHeader><CardTitle className="text-lg dark:text-gray-100">Verification</CardTitle></CardHeader>
      <CardContent className="space-y-2">{inner}</CardContent>
    </Card>
  );
}

// ─── Locked: Quick stats ──────────────────────────────────────────────────
function QuickStatsCard({ system, locked }: { system: MockStudentSystem; locked?: boolean }) {
  const { evidenceCounts } = system;
  const inner = (
    <>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground dark:text-gray-400">Qualifications</span>
        <span className="font-medium dark:text-gray-200">{evidenceCounts.qualifications}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground dark:text-gray-400">Evidence items</span>
        <span className="font-medium dark:text-gray-200">{evidenceCounts.evidenceItems}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground dark:text-gray-400">Readiness submissions</span>
        <span className="font-medium dark:text-gray-200">{evidenceCounts.readinessSubmissions}</span>
      </div>
    </>
  );
  if (locked) return <LockedCard title="Quick stats">{inner}</LockedCard>;
  return (
    <Card className="dark:border-gray-700/60 dark:bg-gray-900/50">
      <CardHeader><CardTitle className="text-lg dark:text-gray-100">Quick stats</CardTitle></CardHeader>
      <CardContent className="space-y-2">{inner}</CardContent>
    </Card>
  );
}

// ─── Locked: Qualifications preview ───────────────────────────────────────
function QualificationsPreviewCard({ system, locked }: { system: MockStudentSystem; locked?: boolean }) {
  const inner = (
    <ul className="space-y-3">
      {system.qualifications.map((q, i) => (
        <li key={i} className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{q.title}</p>
            <p className="text-xs text-muted-foreground dark:text-gray-400">NQF level {q.nqf}</p>
          </div>
          <Badge variant="success" className="shrink-0 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50">{q.status}</Badge>
        </li>
      ))}
    </ul>
  );
  if (locked) return <LockedCard title="Qualifications">{inner}</LockedCard>;
  return (
    <Card className="dark:border-gray-700/60 dark:bg-gray-900/50">
      <CardHeader><CardTitle className="text-lg dark:text-gray-100">Qualifications</CardTitle></CardHeader>
      <CardContent>{inner}</CardContent>
    </Card>
  );
}

// ─── Locked: Workplace evidence preview ───────────────────────────────────
function WorkplaceEvidencePreviewCard({ system, locked }: { system: MockStudentSystem; locked?: boolean }) {
  const { workplaceEvidence } = system;
  const inner = (
    <>
      <p className="text-xs text-muted-foreground dark:text-gray-400 mb-2">{workplaceEvidence.total} logbook entries</p>
      <ul className="space-y-2">
        {workplaceEvidence.recent.map((r, i) => (
          <li key={i}>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.workplace}</p>
            <p className="text-xs text-muted-foreground dark:text-gray-400">{r.role} · {r.range}</p>
          </li>
        ))}
      </ul>
    </>
  );
  if (locked) return <LockedCard title="Workplace evidence">{inner}</LockedCard>;
  return (
    <Card className="dark:border-gray-700/60 dark:bg-gray-900/50">
      <CardHeader><CardTitle className="text-lg dark:text-gray-100">Workplace evidence</CardTitle></CardHeader>
      <CardContent>{inner}</CardContent>
    </Card>
  );
}

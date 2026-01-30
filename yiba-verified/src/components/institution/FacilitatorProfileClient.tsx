"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, FileText, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ProfileDoc = {
  document_id: string;
  document_type: string;
  file_name: string;
  uploaded_at: Date | string;
};

type Profile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  facilitator_id_number: string | null;
  facilitator_qualifications: string | null;
  facilitator_industry_experience: string | null;
  facilitator_profile_complete: boolean;
  facilitatorProfileDocuments: ProfileDoc[];
  completeness_percentage?: number;
  completeness_complete?: boolean;
};

const DOC_TYPES = [
  { type: "FACILITATOR_CV", label: "CV / Resume", required: true },
  { type: "FACILITATOR_CONTRACT", label: "Contract / SLA", required: true },
] as const;

type Props = {
  profile: Profile;
  institutionId: string;
};

export function FacilitatorProfileClient({ profile, institutionId }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({
    facilitator_id_number: profile.facilitator_id_number ?? "",
    facilitator_qualifications: profile.facilitator_qualifications ?? "",
    facilitator_industry_experience: profile.facilitator_industry_experience ?? "",
  });
  const [docs, setDocs] = useState<ProfileDoc[]>(profile.facilitatorProfileDocuments ?? []);
  const [completeness, setCompleteness] = useState({
    percentage: profile.completeness_percentage ?? 0,
    complete: profile.completeness_complete ?? false,
  });
  const cvInputRef = useRef<HTMLInputElement>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/institution/facilitator-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setCompleteness({
        percentage: data.completeness_percentage ?? completeness.percentage,
        complete: data.completeness_complete ?? completeness.complete,
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (documentType: string, file: File) => {
    setUploading(documentType);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("related_entity", "USER_FACILITATOR_PROFILE");
      fd.set("related_entity_id", profile.user_id);
      fd.set("document_type", documentType);
      const res = await fetch("/api/institutions/documents", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      setDocs((prev) => [
        ...prev,
        {
          document_id: data.document_id,
          document_type: documentType,
          file_name: data.file_name,
          uploaded_at: data.uploaded_at ?? new Date().toISOString(),
        },
      ]);
      setCompleteness((prev) => ({ ...prev, percentage: prev.percentage + 20, complete: prev.percentage + 20 >= 100 }));
      toast.success("Document uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const hasDoc = (type: string) => docs.some((d) => d.document_type === type || (type === "FACILITATOR_CV" && d.document_type === "CV") || (type === "FACILITATOR_CONTRACT" && d.document_type === "CONTRACT"));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            Facilitator profile
          </CardTitle>
          <CardDescription>
            Complete your profile so you can be selected as a facilitator in readiness (Form 5). Required: ID number, qualifications, industry experience, CV, and contract.
          </CardDescription>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant={completeness.complete ? "default" : "secondary"}>
              {completeness.percentage}% complete
            </Badge>
            {completeness.complete && (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Ready for Form 5
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="facilitator_id_number">ID / Passport number *</Label>
                <Input
                  id="facilitator_id_number"
                  value={form.facilitator_id_number}
                  onChange={(e) => setForm((p) => ({ ...p, facilitator_id_number: e.target.value }))}
                  placeholder="e.g. 8501015009087"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilitator_qualifications">Qualifications *</Label>
                <textarea
                  id="facilitator_qualifications"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.facilitator_qualifications}
                  onChange={(e) => setForm((p) => ({ ...p, facilitator_qualifications: e.target.value }))}
                  placeholder="List your qualifications..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilitator_industry_experience">Industry experience *</Label>
                <textarea
                  id="facilitator_industry_experience"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.facilitator_industry_experience}
                  onChange={(e) => setForm((p) => ({ ...p, facilitator_industry_experience: e.target.value }))}
                  placeholder="Describe your industry experience..."
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Documents
          </CardTitle>
          <CardDescription>
            Upload your CV and contract. These are required to be selectable as a facilitator in Form 5.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DOC_TYPES.map(({ type, label, required }) => {
            const inputRef = type === "FACILITATOR_CV" ? cvInputRef : contractInputRef;
            return (
              <div key={type} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{label}</p>
                  {hasDoc(type) ? (
                    <p className="text-sm text-muted-foreground">
                      {docs.find((d) => d.document_type === type || (type === "FACILITATOR_CV" && d.document_type === "CV") || (type === "FACILITATOR_CONTRACT" && d.document_type === "CONTRACT"))?.file_name}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 flex items-center gap-1">
                      {required && <AlertCircle className="h-3.5 w-3.5" />}
                      {required ? "Required" : "Optional"}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={!!uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(type, file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!!uploading}
                    onClick={() => inputRef.current?.click()}
                  >
                    {uploading === type ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                    {uploading === type ? "Uploading…" : hasDoc(type) ? "Replace" : "Upload"}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

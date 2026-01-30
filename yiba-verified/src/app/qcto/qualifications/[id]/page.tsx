"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, GraduationCap, Pencil, Tag, History, FileCheck, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function formatStatus(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Active", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
    INACTIVE: { label: "Inactive", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
    RETIRED: { label: "Retired", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
    DRAFT: { label: "Draft", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  };
  return map[status] || { label: status, className: "bg-muted text-muted-foreground" };
}

export default function QctoQualificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [newAlias, setNewAlias] = useState("");
  const [newAliasSource, setNewAliasSource] = useState("QCTO");
  const [versionLabel, setVersionLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchItem = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/qcto/qualifications/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Qualification not found");
          setItem(null);
          return;
        }
        const d = await res.json();
        throw new Error(d.error || "Failed to load");
      }
      const data = await res.json();
      setItem(data);
      setEditForm({
        name: data.name,
        code: data.code ?? "",
        saqa_id: data.saqa_id ?? "",
        curriculum_code: data.curriculum_code ?? "",
        nqf_level: data.nqf_level ?? "",
        credits: data.credits ?? "",
        occupational_category: data.occupational_category ?? "",
        description: data.description ?? "",
        status: data.status,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred");
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/qcto/qualifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          code: editForm.code || null,
          saqa_id: editForm.saqa_id || null,
          curriculum_code: editForm.curriculum_code || null,
          nqf_level: editForm.nqf_level !== "" && editForm.nqf_level != null ? parseInt(String(editForm.nqf_level), 10) : null,
          credits: editForm.credits !== "" && editForm.credits != null ? parseInt(String(editForm.credits), 10) : null,
          occupational_category: editForm.occupational_category || null,
          description: editForm.description || null,
          status: editForm.status,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update");
      }
      toast.success("Qualification updated");
      setEditOpen(false);
      fetchItem();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAlias = async () => {
    const alias = newAlias.trim();
    if (!alias) {
      toast.error("Alias is required");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/qcto/qualifications/${id}/aliases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, source: newAliasSource }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to add alias");
      }
      toast.success("Alias added");
      setAliasOpen(false);
      setNewAlias("");
      setNewAliasSource("QCTO");
      fetchItem();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add alias");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAlias = async (aliasId: string) => {
    try {
      const res = await fetch(`/api/qcto/qualifications/${id}/aliases?aliasId=${encodeURIComponent(aliasId)}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to remove alias");
      }
      toast.success("Alias removed");
      fetchItem();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to remove alias");
    }
  };

  const handleCreateVersion = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/qcto/qualifications/${id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_label: versionLabel.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create version");
      }
      toast.success("Version created");
      setVersionOpen(false);
      setVersionLabel("");
      fetchItem();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create version");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-destructive">{error || "Not found"}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/qcto/qualifications">Back to Qualifications</Link>
        </Button>
      </div>
    );
  }

  const statusBadge = formatStatus(item.status);
  const count = item._count?.readiness_records ?? 0;
  const readinessList = item.readiness_records ?? [];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/qcto/qualifications" className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{item.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setVersionOpen(true)}>
            <History className="h-4 w-4 mr-1" /> Create version
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Canonical fields
          </CardTitle>
          <CardDescription>SAQA / curriculum / NQF / credits</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</span>
            <p className="font-medium mt-0.5">{item.name}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</span>
            <p className="font-mono mt-0.5">{item.code ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SAQA ID</span>
            <p className="font-mono mt-0.5">{item.saqa_id ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Curriculum code</span>
            <p className="font-mono mt-0.5">{item.curriculum_code ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">NQF level</span>
            <p className="mt-0.5">{item.nqf_level != null ? `NQF ${item.nqf_level}` : "—"}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</span>
            <p className="mt-0.5">{item.credits ?? "—"}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Occupational category</span>
            <p className="mt-0.5">{item.occupational_category ?? "—"}</p>
          </div>
          {item.description && (
            <div className="md:col-span-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</span>
              <p className="mt-0.5 text-sm">{item.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" /> Aliases
            </CardTitle>
            <CardDescription>Alternative names for search</CardDescription>
          </div>
          <Button size="sm" onClick={() => setAliasOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add alias
          </Button>
        </CardHeader>
        <CardContent>
          {item.aliases?.length ? (
            <ul className="space-y-2">
              {item.aliases.map((a: { id: string; alias: string; source: string }) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="font-medium">{a.alias}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{a.source}</Badge>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleRemoveAlias(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No aliases. Add one to improve search.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Versions
            </CardTitle>
            <CardDescription>Snapshots over time</CardDescription>
          </div>
          <Button size="sm" onClick={() => setVersionOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Create version
          </Button>
        </CardHeader>
        <CardContent>
          {item.versions?.length ? (
            <ul className="space-y-2">
              {item.versions.map((v: { id: string; version_label: string; created_at: string }) => (
                <li key={v.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="font-mono">{v.version_label}</span>
                  <span className="text-muted-foreground">{new Date(v.created_at).toLocaleDateString("en-ZA")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No versions yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" /> Usage
          </CardTitle>
          <CardDescription>{count} readiness record(s) linked to this qualification</CardDescription>
        </CardHeader>
        <CardContent>
          {readinessList.length ? (
            <ul className="space-y-2">
              {readinessList.map((r: { readiness_id: string; qualification_title: string; readiness_status: string; institution?: { legal_name?: string; trading_name?: string } }) => (
                <li key={r.readiness_id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{r.qualification_title}</span>
                    {r.institution && (
                      <span className="text-muted-foreground ml-2">
                        — {r.institution.trading_name || r.institution.legal_name || "—"}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">{r.readiness_status?.replace(/_/g, " ")}</Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/qcto/readiness/${r.readiness_id}`}>View</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No linked readiness records.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit qualification</DialogTitle>
            <DialogDescription>Update canonical fields.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={String(editForm.name ?? "")} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={String(editForm.code ?? "")} onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>SAQA ID</Label>
                <Input value={String(editForm.saqa_id ?? "")} onChange={(e) => setEditForm((p) => ({ ...p, saqa_id: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Curriculum code</Label>
              <Input value={String(editForm.curriculum_code ?? "")} onChange={(e) => setEditForm((p) => ({ ...p, curriculum_code: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NQF level</Label>
                <Input type="number" value={String(editForm.nqf_level ?? "")} onChange={(e) => setEditForm((p) => ({ ...p, nqf_level: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Credits</Label>
                <Input type="number" value={String(editForm.credits ?? "")} onChange={(e) => setEditForm((p) => ({ ...p, credits: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Occupational category</Label>
              <Input value={String(editForm.occupational_category ?? "")} onChange={(e) => setEditForm((p) => ({ ...p, occupational_category: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={String(editForm.description ?? "")} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={String(editForm.status ?? "ACTIVE")} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} className="w-full">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="RETIRED">Retired</option>
                <option value="DRAFT">Draft</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={submitting || !editForm.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aliasOpen} onOpenChange={setAliasOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Add alias</DialogTitle>
            <DialogDescription>Add an alternative name for search.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Alias *</Label>
              <Input value={newAlias} onChange={(e) => setNewAlias(e.target.value)} placeholder="e.g. Diploma in IT" />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={newAliasSource} onChange={(e) => setNewAliasSource(e.target.value)} className="w-full">
                <option value="QCTO">QCTO</option>
                <option value="SAQA">SAQA</option>
                <option value="INSTITUTION">Institution</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAliasOpen(false)}>Cancel</Button>
            <Button onClick={handleAddAlias} disabled={submitting || !newAlias.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Create version snapshot</DialogTitle>
            <DialogDescription>Capture current state as a version (e.g. 2024-08).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Version label</Label>
              <Input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} placeholder="e.g. 2024-08 or leave blank for date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateVersion} disabled={submitting}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

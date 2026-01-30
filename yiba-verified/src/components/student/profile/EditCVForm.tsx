"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, X, Pencil, Plus, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MockStudentEditable } from "@/components/student/StudentProfileClient";

export type EditCVFormProps = {
  editable: MockStudentEditable;
  onBioChange: (v: string) => void;
  onSkillsChange: (v: string[]) => void;
  onProjectsChange: (v: MockStudentEditable["projects"]) => void;
  className?: string;
};

export function EditCVForm({
  editable,
  onBioChange,
  onSkillsChange,
  onProjectsChange,
  className,
}: EditCVFormProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <BioSection bio={editable.bio} onBioChange={onBioChange} />
      <SkillsSection skills={editable.skills} onSkillsChange={onSkillsChange} />
      <ProjectsSection projects={editable.projects} onProjectsChange={onProjectsChange} />
    </div>
  );
}

function BioSection({ bio, onBioChange }: { bio: string; onBioChange: (v: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">About</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="A short summary for employers…"
          rows={4}
          className="resize-none"
        />
      </CardContent>
    </Card>
  );
}

function SkillsSection({ skills, onSkillsChange }: { skills: string[]; onSkillsChange: (v: string[]) => void }) {
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
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.length > 0 && (
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
                  <button type="button" onClick={() => remove(i)} className="p-0.5 rounded hover:bg-destructive/10 text-destructive" aria-label="Remove">
                    <X className="h-3 w-3" strokeWidth={2} />
                  </button>
                </div>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Add a skill"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            className="max-w-[200px]"
          />
          <Button variant="outline" size="sm" onClick={add}>
            <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type Project = { id: string; title: string; description: string; link?: string };

function ProjectsSection({ projects, onProjectsChange }: { projects: Project[]; onProjectsChange: (v: Project[]) => void }) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState({ title: "", description: "", link: "" });

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
      onProjectsChange([...projects, { id: "p-" + Date.now(), ...form, link: form.link || undefined }]);
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
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.length === 0 && !editingId && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">Add projects to showcase your work.</p>
            <Button variant="outline" size="sm" onClick={startAdd}>
              <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
              Add project
            </Button>
          </div>
        )}
        {(projects.length > 0 || editingId) && (
          <ul className="space-y-4">
            {editingId === "new" && (
              <li className="rounded-lg border border-border p-3 space-y-2">
                <Input placeholder="Project title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                <Textarea placeholder="Short description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="resize-none" />
                <Input placeholder="Link (optional)" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={save}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </li>
            )}
            {projects.map((p) =>
              editingId === p.id ? (
                <li key={p.id} className="rounded-lg border border-border p-3 space-y-2">
                  <Input placeholder="Project title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                  <Textarea placeholder="Short description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="resize-none" />
                  <Input placeholder="Link (optional)" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={save}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </li>
              ) : (
                <li key={p.id} className="flex items-start justify-between gap-2 rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
                        View link
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-8" onClick={() => startEdit(p)} aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/10" onClick={() => remove(p.id)} aria-label="Remove">
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
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

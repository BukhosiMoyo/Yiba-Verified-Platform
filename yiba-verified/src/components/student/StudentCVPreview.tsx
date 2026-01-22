"use client";

import { cn } from "@/lib/utils";

type Editable = {
  photoUrl: string | null;
  bio: string;
  skills: string[];
  projects: { id: string; title: string; description: string; link?: string }[];
};

type System = {
  header: { name: string; verifiedBy: string; institutions: { name: string; studentId?: string }[] };
  qualifications: { title: string; nqf: string; status: string }[];
  workplaceEvidence: { total: number; recent: { workplace: string; role: string; range: string }[] };
};

export type StudentCVPreviewProps = {
  editable: Editable;
  system: System;
  /** When viewing a specific CV version, e.g. "Project Management" */
  targetRole?: string;
  /** Compact for tight spaces (e.g. sidebar), full for CV Versions tab */
  variant?: "compact" | "full";
  className?: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("pt-3", className)}>
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-700 pb-1 mb-2">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function StudentCVPreview({
  editable,
  system,
  targetRole,
  variant = "full",
  className,
}: StudentCVPreviewProps) {
  const name = system.header.name;
  const inst = system.header.institutions[0];
  const studentId = inst?.studentId ?? "—";

  return (
    <article
      className={cn(
        "rounded-lg border shadow-sm overflow-hidden",
        "bg-[#fefdfb] dark:bg-stone-900/95",
        "border-stone-200/80 dark:border-stone-700/60",
        "text-stone-800 dark:text-stone-200",
        variant === "compact" ? "p-4 text-sm" : "p-5 md:p-6",
        className
      )}
    >
      {/* Header: photo, name, target role, verified */}
      <header className="flex gap-4 pb-3 border-b border-stone-200/80 dark:border-stone-700/60">
        <div
          className={cn(
            "shrink-0 rounded-full overflow-hidden flex items-center justify-center font-semibold text-white",
            "bg-gradient-to-br from-stone-500 to-stone-600",
            variant === "compact" ? "h-12 w-12 text-sm" : "h-14 w-14 text-base"
          )}
        >
          {editable.photoUrl ? (
            <img src={editable.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            getInitials(name)
          )}
        </div>
        <div className="min-w-0">
          <h1 className={cn("font-bold text-stone-900 dark:text-stone-100", variant === "compact" ? "text-lg" : "text-xl")}>
            {name}
          </h1>
          {targetRole && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Target role: {targetRole}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              Verified
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              {inst?.name ?? "—"} · {studentId}
            </span>
          </div>
        </div>
      </header>

      {/* Summary */}
      {editable.bio && (
        <Section title="Summary" className="pt-3">
          <p className="text-[13px] leading-relaxed text-stone-700 dark:text-stone-300">
            {editable.bio}
          </p>
        </Section>
      )}

      {/* Skills */}
      {editable.skills.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {editable.skills.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="inline-flex rounded-md bg-stone-100 dark:bg-stone-800/60 px-2 py-0.5 text-[11px] font-medium text-stone-600 dark:text-stone-300"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {editable.projects.length > 0 && (
        <Section title="Projects">
          <ul className="space-y-2">
            {editable.projects.map((p) => (
              <li key={p.id}>
                <p className="text-[13px] font-semibold text-stone-900 dark:text-stone-100">{p.title}</p>
                <p className="text-[12px] text-stone-600 dark:text-stone-400 leading-snug">{p.description}</p>
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {p.link.replace(/^https?:\/\//, "").slice(0, 40)}{p.link.length > 40 ? "…" : ""}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Qualifications (system) */}
      {system.qualifications.length > 0 && (
        <Section title="Qualifications">
          <ul className="space-y-1.5">
            {system.qualifications.map((q, i) => (
              <li key={i} className="flex justify-between gap-2">
                <div>
                  <span className="text-[13px] font-medium text-stone-900 dark:text-stone-100">{q.title}</span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 ml-1">NQF {q.nqf}</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">{q.status}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Experience (system) */}
      {system.workplaceEvidence.recent.length > 0 && (
        <Section title="Experience">
          <ul className="space-y-1.5">
            {system.workplaceEvidence.recent.map((r, i) => (
              <li key={i}>
                <p className="text-[13px] font-medium text-stone-900 dark:text-stone-100">{r.workplace}</p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">{r.role} · {r.range}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Footer note when nothing else */}
      {!editable.bio && editable.skills.length === 0 && editable.projects.length === 0 &&
       system.qualifications.length === 0 && system.workplaceEvidence.recent.length === 0 && (
        <p className="text-[12px] text-stone-400 dark:text-stone-500 italic pt-2">
          Add your bio, skills, and projects in Overview to see them here.
        </p>
      )}
    </article>
  );
}

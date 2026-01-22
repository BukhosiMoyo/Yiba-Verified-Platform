# Form 5 Readiness — Full-Page Redesign Prompt

## 1. SCOPE

- **What:** Recreate the Form 5 Readiness edit experience as a **full-page layout** with a **dedicated right sidebar** for tips, suggestions, and best practices.
- **Where:**
  - Route: `/institution/readiness/[readinessId]`. When `canEdit`, replace the current (read-only cards + `ReadinessEditForm`) with the new full-page form. When `!canEdit`, keep the existing read-only view.
- **Components:**
  - `ReadinessFormFullPage` — client component: top bar, two-column layout (form | sidebar), progress bar, 10 steps, autosave, Review & Submit dialog.
  - `ReadinessFormSidebar` — right sidebar: tips, suggestions, best practices per step.
- **Preserve:** All form state, `buildUpdatePayload`, autosave, `getCompletionFromFormData`, Review & Submit dialog, PATCH, `canSubmit`/`canEdit`. All 10 steps and fields unchanged.

---

## 2. LAYOUT

- **Two columns (xl+):**
  - **Left (main):** ~65–70%. Progress bar + current step form. Dot background on form panel.
  - **Right (sidebar):** ~30–35%, sticky. Tips, Suggestions, Best practices for current step.
- **Below xl:** Single column. Form full width; "Tips & best practices" block below form (same `ReadinessFormSidebar` content).
- **Top bar:** Back, title "Form 5 Readiness — [Qualification title]", status badge, autosave indicator. Compact; blue gradient.

---

## 3. THEME & VISUALS

- **Primary/blue:** `primary`, `blue-500`, `blue-600`, `sky-500`, `indigo-500` for buttons, progress fill, active step, links, headings.
- **Gradients:**
  - Top bar: `bg-gradient-to-r from-blue-600 to-indigo-700` with `before:` radial overlay for depth.
  - Form panel: `bg-gradient-to-b from-sky-50/80 to-white` + dot pattern.
  - Sidebar: `bg-slate-50/80` or `bg-blue-50/40`, `border-l border-blue-200/60`.
- **Dot background:**
  - New `.readiness-form-pattern` in `globals.css`: blue-tinted dots (`fill` #2563eb or #3b82f6, `fill-opacity` 0.08–0.10). Mask: fade toward bottom. Apply to main form panel.
- **Typography:**
  - Form: section `text-lg font-semibold text-gray-900`; labels `text-sm font-medium text-gray-700`; helper `text-xs text-muted-foreground`.
  - Sidebar: block titles `text-sm font-semibold text-gray-800`; body `text-sm text-gray-600` leading-relaxed.

---

## 4. SIDEBAR CONTENT (Tips, Suggestions, Best Practices)

Per-step content in `READINESS_SIDEBAR_CONTENT: Record<number, { tips?: string[]; suggestions?: string[]; bestPractices?: string[] }>`.

- **Step 1 (Qualification):** Tips: exact SAQA title, curriculum code from OQSF. Suggestions: confirm NQF from SAQA. Best: double-check SAQA ID.
- **Step 2 (Self-Assessment):** Tips: be honest; supports QCTO review. Suggestions: attach evidence via Documents. Best: concise, evidence-based remarks.
- **Step 3 (Registration & Legal):** Tips: registration proof current and legible. Suggestions: upload professional body cert if applicable. Best: entity name matches institution.
- **Step 4 (Infrastructure):** Tips: full physical address. Suggestions: room capacity and facilitator:learner ratio. Best: ownership/lease matches site address.
- **Step 5 (Learning Materials):** Tips: ≥50% coverage for samples. Suggestions: map to knowledge/practical modules. Best: align to OQSF; note gaps.
- **Step 6 (OHS):** Tips: evacuation plan visible on site. Suggestions: up-to-date extinguisher and first-aid records. Best: OHS rep trained and appointed in writing.
- **Step 7 (LMS):** Tips: required for Blended/Mobile only. Suggestions: vendor, version, licence. Best: backup and security clearly described.
- **Step 8 (WBL):** Tips: agreements define roles and assessment. Suggestions: logbook and monitoring schedule. Best: workplace partner qualified to mentor/assess.
- **Step 9 (Policies):** Tips: all seven policy types documented and uploaded. Suggestions: effective and review dates. Best: institution-wide policies.
- **Step 10 (Facilitators):** Tips: at least one facilitator with CV and contract. Suggestions: list Facilitator/Assessor/Moderator. Best: qualifications and industry experience clear; SAQA evaluation helps.

---

## 5. BEHAVIOUR TO KEEP

- 10 steps, progress bar, Prev/Next, clickable step segments.
- Autosave: debounced PATCH, `buildUpdatePayload`, `saveStatus`, `canSubmit` guard.
- Review & Submit: score, key details, section status, required warning, `handleSubmitForReview`.
- Form state, `buildUpdatePayload`, `getCompletionFromFormData` unchanged.

---

## 6. FILES

- **New:** `globals.css` (`.readiness-form-pattern`), `ReadinessFormSidebar.tsx`, `ReadinessFormFullPage.tsx`.
- **Modify:** `[readinessId]/page.tsx` — if `canEdit` render `ReadinessFormFullPage`, else existing read-only.

---

## 7. RESPONSIVENESS & A11Y

- xl+: two columns; sidebar sticky.
- &lt;xl: single column; tips below form.
- Keep `aria-label`, `aria-current`, `role="progressbar"`; sensible focus order.

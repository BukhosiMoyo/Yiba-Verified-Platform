# Student CV / Profile — Internal Improvement Plan

**Generated from codebase analysis. Do not assume; all items are rooted in existing code.**

---

## 1. What Exists Today

### 1.1 Entry Points & Routing

| Item | Location | Notes |
|------|----------|-------|
| **Page** | `src/app/student/profile/page.tsx` | Renders `<StudentProfileClient />` only. No server data fetch; TODOs for `GET /api/me` and “No learner profile linked” empty state. |
| **Nav label** | `src/lib/navigation.ts` → `getStudentNavItems()` | **“My Profile”** at `/student/profile`, second after Dashboard, `LEARNER_VIEW` capability. |
| **Middleware** | `src/middleware.ts` | `/student` and `/student/:path*` protected. |
| **Student dashboard** | `src/app/student/page.tsx` | No “My CV” or “My Profile” card; focuses on Enrolments, Metrics, Recent Updates. |

The brief asks for **“My CV”** to be easy to find. Current label is **“My Profile”**. The CV is one tab inside that page.

---

### 1.2 Main Components & Layout

| Component | File | Role |
|-----------|------|------|
| **StudentProfileClient** | `src/components/student/StudentProfileClient.tsx` | Top-level: tabs (Overview, CV Versions, Credentials, Workplace, Documents, Settings), state, and all sections. |
| **StudentProfileHeader** | `src/components/student/StudentProfileHeader.tsx` | Avatar, name, Verified badge, Student ID, Institution. Actions: **Edit Profile**, **Download CV** (dropdown), **Share Profile** (dropdown), **Create CV Version**. Photo update modal (demo: object URL in state). |
| **StudentCVPreview** | `src/components/student/StudentCVPreview.tsx` | Read-only CV: header (photo/initials, name, target role, “Verified” pill), Summary, Skills, Projects, Qualifications (system), Experience (system). Variants: `compact` | `full`. |
| **StudentCVVersionsTable** | `src/components/student/StudentCVVersionsTable.tsx` | Table: CV Name, Target Role, Visibility, Last Updated, Actions (View, Edit, ⋮ → Duplicate, Download, Share). Filter bar, pagination, empty state. |

---

### 1.3 Data: Editable vs System (Yiba Verified)

**Editable (student, in-memory only; TODO: `PATCH /api/me`):**

- `MockStudentEditable`: `photoUrl`, `bio`, `skills`, `projects[]`.

**System / read-only (TODO: from learner/institution/qualifications/evidence):**

- `MockStudentSystem`: `header` (name, verifiedStatus, verifiedDate, verifiedBy, institutions, downloadCvOptions, shareOptions), `qualifications[]`, `evidenceCounts`, `workplaceEvidence`.

**CV versions:** `mockCVs` (id, name, targetRole, visibility, lastUpdated). Type `CVVersionRow`; TODO: replace with real API.

**Persistence:** None. `Learner` in Prisma has no `bio`, `skills`, `projects`, or `CvVersion` model. `GET /api/me` and CV/profile APIs do not exist.

---

### 1.4 Overview Tab — Editing vs Preview (Reported Issue)

**Current grid (`StudentProfileClient`, Overview `TabsContent`):**

```tsx
<div className="grid gap-6 lg:grid-cols-5">
  {/* Left: Editable — lg:col-span-3 (3/5) */}
  <div className="space-y-6 lg:col-span-3">
    <AboutCard ... />
    <SkillsCard ... />
    <ProjectsCard ... />
  </div>
  {/* Right: Preview + Verified — lg:col-span-2 (2/5) */}
  <div className="space-y-6 lg:col-span-2">
    <h2>Live CV Preview</h2>
    <StudentCVPreview variant="compact" ... />
    <VerificationCard ... />
    <QuickStatsCard ... />
    <QualificationsPreviewCard ... />
    <WorkplaceEvidencePreviewCard ... />
  </div>
</div>
```

- **Left (editing):** 3/5 columns — About, Skills, Projects.  
- **Right (preview + verified):** 2/5 columns — Live CV Preview plus four locked cards.

So the **editing block is larger than the preview**. The preview also shares the right column with Verification, Quick stats, Qualifications, Workplace evidence, so the **CV preview’s visual share is small**. This matches the reported issue: *“editing section appears larger than the preview”* and *“preview is the most important part.”*

---

### 1.5 CV Versions Tab — Table vs Preview

**Current grid (`TabsContent value="cv"`):**

```tsx
<div className="grid gap-6 xl:grid-cols-5">
  <div className="xl:col-span-3 space-y-4">  /* Table */}
    <StudentCVVersionsTable ... />
  </div>
  <div className="xl:col-span-2">  /* Preview */}
    <div className="xl:sticky xl:top-24">
      <h3>Preview: {name}</h3>
      <StudentCVPreview variant="full" ... />
    </div>
  </div>
</div>
```

Same 3:2: table 3/5, preview 2/5. Preview is sticky, which helps, but it is still the smaller column.

---

### 1.6 Verification in the UI

- **Header:** `verifiedStatus` badge, `verifiedDate`, `verifiedBy`, institution, Student ID.  
- **CV Preview:** “Verified” pill (emerald), `{institution} · {studentId}`; Qualifications show `{q.status}` (e.g. “Verified” in emerald).  
- **Locked cards:** `LockedCard` with Lock icon and “Auto-filled” badge; blue tint (`LOCKED_CARD_CLASS`).  
- **StudentCVPreview:** All `system.*` (qualifications, experience) are shown as verified-institution data; no “external” or “self‑uploaded” distinction in the model or UI.

---

### 1.7 Download, Share, PDF

- **Download CV** (`StudentProfileHeader`): `DropdownMenu` with `downloadCvOptions` (e.g. Primary, PM, Support). **No `onClick`**, no API, no PDF.  
- **Download** in `StudentCVVersionsTable` row menu: **No handler.**  
- **Share Profile:** `DropdownMenu` with `shareOptions` (Public, Private). **No `onClick`**, no copy-link, no public URL.  
- **PDF:** No `jspdf`, `html2pdf`, `puppeteer`, `react-pdf`, or similar in `package.json`. `ExportButton` does CSV/JSON via `exportUrl`; no PDF.  
- **Public profile:** No `/p/[slug]`, `/profile/[id]`, or `/student/profile/public` route. `publicProfile` and `hideContact` in Settings are local state only.

---

### 1.8 Certificates & Evidence

- **`/student/certificates`:** Empty state only: “Certificates will appear here when you complete a qualification…”  
- **StudentProfileClient:** “Credentials” and “Workplace” tabs: `Card` + `CardDescription` placeholders. “Documents” tab: same.  
- **Verified vs external:** `StudentCVPreview` only shows `system.qualifications` and `system.workplaceEvidence`. No UI or model for “external certificates” or “student-uploaded” vs “institution-verified.”

---

### 1.9 Other Tabs

- **Credentials, Workplace, Documents:** Placeholder cards only.  
- **Settings:** Public profile, Hide contact toggles; state only, no API.

---

## 2. Improvement Plan (Prioritised)

### 2.1 Polish: Preview vs Editing (High — Explicit Ask)

**Objective:** Make the **preview visually dominant**; keep the same design system and components.

**Overview tab**

- **Current:** `lg:grid-cols-5` with editing `lg:col-span-3`, right `lg:col-span-2` (Preview + locked cards).
- **Change:**
  - Swap proportions: **Preview column larger, editing smaller.**  
    - Option A: `lg:col-span-2` (editing) and `lg:col-span-3` (preview + verified).  
    - Option B: `lg:col-span-2` (editing) and `lg:col-span-3` for **preview only**, and move Verification, Quick stats, Qualifications, Workplace into a **second row** or **collapsible/compact strip** so the main “above the fold” focus is the CV.  
  - Ensure “Live CV Preview” is the first and largest block in the right column (or in the main content when reflowed).  
  - On small screens: consider stacking **Preview above** the editing cards (already what happens when the grid stacks), so the first thing is “what employers see.”

**CV Versions tab**

- **Current:** Table `xl:col-span-3`, Preview `xl:col-span-2`.  
- **Change:** Swap to **Preview `xl:col-span-3`**, Table `xl:col-span-2`.  
  - If the table feels cramped: reduce filters to one row, or move “Create CV Version” only to the table header; or use a more compact table (e.g. cards on small screens).  
  - Keep `xl:sticky xl:top-24` on the preview so it stays in view when scrolling the list.

**Design system:** Reuse existing `Card`, `Tabs`, `StudentCVPreview`, `LockedCard`; only adjust grid spans, order, and optional grouping. No new UI library.

---

### 2.2 PDF Download (High — Explicit Ask)

**Objective:** PDF that matches the preview, looks professional, and distinguishes verified vs non‑verified. Optional: QR or short verification link to the online profile.

**Current:** Download buttons and menus exist but have no behaviour.

**Implement:**

1. **PDF generation**
   - Prefer **HTML → PDF** so the PDF matches `StudentCVPreview`:
     - **`@react-pdf/renderer`** (React tree → PDF), or  
     - **`html2pdf.js`** (or similar) on a dedicated “print view” DOM subtree that mirrors `StudentCVPreview` (with `variant="full"`), plus a simple header/footer.  
   - If a separate “print/PDF template” is used, it must be kept in sync with `StudentCVPreview` (same sections, verified badges, typography).

2. **Verified vs non‑verified in the PDF**
   - Reuse the same visual language as in `StudentCVPreview`:
     - “Verified” pill and institution/Student ID for system data.  
     - Qualifications: keep the “Verified”/status text.  
     - For any future “external” or “self‑reported” section: clearly label (e.g. “Self‑reported” / “Not institution‑verified”).

3. **QR or verification link (enhancement)**
   - When a **public profile URL exists** (e.g. `/p/[id]` or `/verify/[token]`):
     - Add a small **QR code** in the PDF footer (or header) pointing to that URL.  
     - And/or a short line: “Verify at: [short link]” or “Yiba Verified — [link]”.  
   - Use a small, well‑known QR library (e.g. `qrcode` or `qrcode.react`).  
   - If there is no public/verify URL yet, add a **placeholder** (e.g. “Verify at yiba.co.za” or “Verification link coming soon”) so the PDF layout can be finalised; the real URL can be wired when the route exists.

4. **Wiring**
   - **Header “Download CV”:** `onClick` on the chosen option (e.g. Primary) → run PDF generation for the **selected** CV version (or default) and trigger download.  
   - **CV Versions table row → Download:** same, for that row’s `id` / `targetRole`.  
   - Filename: e.g. `{firstName}-{lastName}-CV-{versionName}.pdf` or `{name}-YibaVerified-CV.pdf`.

**Dependencies:** Add only what’s needed for PDF (and QR if done now). No change to `ExportButton`’s CSV/JSON behaviour.

---

### 2.3 Share & Public Profile (Medium — Foundation)

**Objective:** Students can share a profile link; the shared view is recognisably “them” and reflects verified data.

**Current:** Share menu and Settings toggles exist; no handlers, no public route.

**Implement (minimal):**

1. **Share Profile dropdown**
   - “Public link”: copy to clipboard the **public profile URL** (or “Coming soon” if the route does not exist yet). Toast: “Link copied.”  
   - “Private link”: same, but with an optional token (if/when supported); for now can mirror “Public” or show “Coming soon.”

2. **Public profile route (when ready)**
   - e.g. ` /p/[id]` or ` /profile/[id]` or ` /verify/[token]`.  
   - Renders a **read‑only** view of the CV: reuse `StudentCVPreview` (and same verified vs non‑verified rules as in the app).  
   - Respect `publicProfile` and `hideContact` when those are persisted.  
   - No employer directory or search; link-only access.

3. **Settings**
   - When `PATCH /api/student/profile` or similar exists: persist `publicProfile` and `hideContact`.  
   - Until then: keep local state; no need to surface “not saved” if the whole profile is demo.

**Defer:** Student directory, employer browsing, filters. Only the shareable link and a solid read‑only public page.

---

### 2.4 Download & Share Behaviour (Quick Wins)

Even before PDF and public URL:

- **Download CV (Header):** `onClick` on each option → e.g. `toast.info("PDF download coming soon")` or, once PDF is ready, trigger the correct CV.  
- **Share:** `onClick` on “Public link” → `navigator.clipboard.writeText(window.location.origin + "/student/profile")` and toast “Link copied (private profile).” This avoids a dead click and sets the pattern for when the real public URL exists.

---

### 2.5 Certificates & Evidence Clarity (Medium)

**Objective:** Verified institution data clearly marked; allow external/uploaded if supported; no confusion.

**Current:** Certificates page and Credentials/Workplace/Documents tabs are placeholders. `StudentCVPreview` only has `system.qualifications` and `system.workplaceEvidence`.

**Implement:**

1. **When Certificates / Credentials get real data**
   - **Institution‑verified:** re-use the same “Verified” / “Auto‑filled” treatment as in the preview and locked cards.  
   - **External / student‑uploaded:** if the model supports it, show a distinct label: e.g. “Self‑reported” or “Not institution‑verified” (or “External”) with a muted style.  
   - If the model does **not** support external yet: do not add it; only document that the current UI is institution‑only.

2. **StudentCVPreview**
   - When/if an “external” source is added to `system` or `editable`, add a subsection (e.g. “Other qualifications”) with the “Self‑reported”/“External” label.  
   - Keep verified blocks visually dominant.

3. **Documents tab**
   - If it later lists uploads: same rule — “Institution‑verified” vs “Uploaded by you” (or equivalent) if the schema supports it.

---

### 2.6 Optional: Introduction Video (Low — Only If It Fits)

**Rules:** Optional, no empty state if absent, professional if present; in PDF: link or QR, not embedded.

**Current:** No video field or UI.

**Add only if:**

- A place in the **data model** for an optional URL (e.g. `Learner.intro_video_url` or `CvVersion.intro_video_url`) can be added without overcomplicating the schema, and  
- The **profile/CV layout** has a natural spot (e.g. under the header in `StudentCVPreview`, or in a “Media” block) that does not unbalance the page.

**Implementation sketch:**

- **Profile:** Optional “Introduction video” with URL input; empty = no block.  
- **Preview:** If URL present: thumbnail + “Watch introduction” link; if absent: nothing.  
- **PDF:** Text line: “Introduction: [URL]” or a small QR for the video URL. No `<video>` or embedded player in the PDF.

**If it doesn’t fit cleanly:** Omit; the plan does not depend on it.

---

### 2.7 Navigation & Visibility (Low)

**Objective:** “My CV” / profile feels core and easy to reach.

**Current:** “My Profile” is second in the student nav; dashboard has no direct CV/profile card.

**Changes (low‑impact):**

1. **Nav label**
   - Consider renaming **“My Profile”** → **“My Profile & CV”** or adding a child **“My CV”** that goes to `/student/profile#cv` or `?tab=cv`.  
   - Or keep “My Profile” and add a short descriptor in the nav (e.g. in the sidebar subtext or tooltip): “Profile & CV.”  
   - Do not add new routes unless a separate “CV-only” page is desired later.

2. **Student dashboard**
   - Add a **“My CV”** or **“My Profile & CV”** card:
     - Line: “View and share your verified CV” (or similar).  
     - Link to `/student/profile` or `/student/profile?tab=cv`.  
   - Reuse `Card` and link style from “My Enrolments” / “View all” for consistency.

---

### 2.8 Data & APIs (Ongoing — Out of Scope for “Polish”)

**Do not do in this pass:** New backend, migrations, or API design. Only note what the UI expects so future work is clear.

- **GET /api/me** (or `/api/student/profile`): `header`, `qualifications`, `evidenceCounts`, `workplaceEvidence`, `downloadCvOptions`, `shareOptions`, and, when supported, `publicProfile`, `hideContact`, `introVideoUrl`.  
- **PATCH /api/me** (or `/api/student/profile`): `bio`, `skills`, `projects`, `photoUrl` (or upload), and later `publicProfile`, `hideContact`.  
- **CV versions:** `GET /api/student/cv-versions`, `POST`, `PATCH`, `DELETE`; or a single “profile” that includes `cvVersions[]`.  
- **Public profile:** `GET /api/p/[id]` or `GET /api/verify/[token]` returning the same shape as the private “profile for display,” with `publicProfile` and `hideContact` applied.

`StudentProfileClient` and `StudentProfileHeader` already have TODOs and types that align with this.

---

### 2.9 Pricing (Do Not Touch)

- Do not surface pricing, change access, or enable any paywall.  
- If there is existing pricing logic (not found in the analysed code): leave it off.

---

## 3. Implementation Order (Suggested)

1. **Preview vs editing (layout)**  
   - Overview: swap to 2:3 (edit : preview) and, if needed, move locked cards so the preview is dominant.  
   - CV tab: swap to 2:3 (table : preview).  
   - Verify on desktop and mobile.

2. **Download & Share (placeholders)**  
   - Add `onClick` for Download (toast or future PDF) and Share (copy private link + toast).  
   - Ensures no dead buttons.

3. **PDF generation**  
   - Choose and add library; implement “print” view aligned with `StudentCVPreview`; verified vs non‑verified in PDF; wire Header and table Download.  
   - Add QR/verification line when public/verify URL exists (or placeholder).

4. **Share + Public URL (when ready)**  
   - Implement public profile route; wire Share to copy that URL; optionally persist toggles.

5. **Certificates & evidence**  
   - When backend and tabs have real data: apply verified vs external labelling in Certificates, Credentials, and `StudentCVPreview` as above.

6. **Introduction video (optional)**  
   - Only if model and layout allow a minimal, optional addition.

7. **Nav and dashboard**  
   - Optional label tweak and “My CV” (or “My Profile & CV”) card on the student dashboard.

---

## 4. Files to Touch (Summary)

| Area | Files |
|------|-------|
| **Layout (preview vs edit)** | `StudentProfileClient.tsx` (grid `col-span`, order, grouping of locked cards) |
| **Download / Share** | `StudentProfileHeader.tsx` (onClick, copy, toast); `StudentCVVersionsTable.tsx` (Download onClick) |
| **PDF** | New: `StudentCVPdf.tsx` or print-only view + `lib/pdf-cv.ts` (or equivalent); `package.json` (PDF + optional QR lib) |
| **Public profile** | New: `app/p/[id]/page.tsx` or `app/profile/[id]/page.tsx`; optional `api/p/[id]/route.ts` |
| **Certificates / evidence** | `StudentCVPreview.tsx` (if external), Certificates page, Credentials/Workplace/Documents in `StudentProfileClient` when they have data |
| **Intro video** | `StudentProfileClient`, `StudentCVPreview`, `StudentCVPdf`/print view (if added) |
| **Nav & dashboard** | `src/lib/navigation.ts`; `src/app/student/page.tsx` |

---

## 5. Definition of Done (Polish)

- [ ] **Preview prioritised:** In Overview and CV tabs, the preview column is larger than the editing/table column; on small screens, preview is above.  
- [ ] **Download:** At least one “Download CV” path produces a PDF that matches the preview and marks verified vs non‑verified; optional QR/verification line.  
- [ ] **Share:** “Share Profile” copies a link (public when available, otherwise private) and shows feedback.  
- [ ] **No dead actions:** Download and Share have `onClick` and clear behaviour or “Coming soon” feedback.  
- [ ] **Verified vs external:** When those data exist, they are clearly distinguished in the preview and in the PDF.  
- [ ] **Same design system:** Only existing components and tokens; no full redesign.  
- [ ] **Pricing:** Not surfaced; access unchanged.

---

*Document generated from analysis of the Yiba Verified codebase. Implement incrementally; recompute file/line references if the code has changed.*

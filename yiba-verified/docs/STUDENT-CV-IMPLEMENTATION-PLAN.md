# Student CV / Profile — Implementation Plan

A phased implementation plan for the Student CV and Profile improvements. For context and analysis, see `STUDENT-CV-PROFILE-IMPROVEMENT-PLAN.md`.

---

## Overview

| Phase | Focus | Outcome |
|-------|--------|---------|
| **1** | Layout | Preview is the main focus; no dead buttons |
| **2** | PDF + Share | Working download and share; optional QR |
| **3** | Public profile | Shareable link and read-only public page |
| **4** | Polish | Nav, dashboard, and optional intro video |

---

## Phase 1: Layout + No Dead Buttons

**Goal:** Preview dominates; every Download/Share action does something (even if “coming soon”).

**Why first:** Layout is the main reported issue and is UI-only. Wiring buttons prevents confusion and sets the pattern for Phase 2.

---

### 1.1 Overview tab — Preview first

**File:** `src/components/student/StudentProfileClient.tsx`

| # | Task | Details |
|---|------|---------|
| 1 | Swap grid proportions | `lg:grid-cols-5`: left (editing) `lg:col-span-2`, right (preview + locked) `lg:col-span-3` |
| 2 | Put preview on top on mobile | Put the **preview column’s `div` first in the grid markup** so that when the grid stacks (below `lg`), the preview appears above the editing cards. Do not use `order`; DOM order is enough and avoids flex/grid ordering quirks |
| 3 | (Optional) Reduce clutter in right column | If the preview still feels small: move Verification, Quick stats, Qualifications, Workplace into a **collapsible “Verified details”** block below the preview, or a second row. Preview stays the hero |

**Check:** On desktop, preview column is wider than edit; on mobile, preview is above. Same components and styles.

---

### 1.2 CV Versions tab — Preview first

**File:** `src/components/student/StudentProfileClient.tsx`

| # | Task | Details |
|---|------|---------|
| 1 | Swap grid | `xl:grid-cols-5`: table `xl:col-span-2`, preview `xl:col-span-3` |
| 2 | Preview before table on small screens | Put the preview `div` first in the markup so it appears above the table when stacked |
| 3 | Keep preview sticky | Leave `xl:sticky xl:top-24` on the preview `div` |
| 4 | Table fit | If the table feels cramped in 2 columns: move **“Create CV Version”** into the table header as a single primary action (e.g. right-aligned), and keep Search + Visibility + Role + Rows-per-page filters on one line with wrap. No new layout structure |

**Check:** Preview is the larger column on `xl`; table remains usable; preview stays sticky when scrolling.

---

### 1.3 Wire Download and Share (placeholder behaviour)

**Files:** `StudentProfileHeader.tsx`, `StudentCVVersionsTable.tsx`

| # | Task | Details |
|---|------|---------|
| 1 | **Header — Download CV** | For each `DropdownMenuItem` in the Download menu: `onSelect` → `toast.info("PDF download coming soon")` (reuse `toast` from `sonner`). Pass the option `id` into the handler so Phase 2 can switch on it |
| 2 | **Header — Share Profile** | “Public link” → `navigator.clipboard.writeText(origin + "/student/profile")`, then `toast.success("Profile link copied")`. “Private link” → same for now, or `toast.info("Private link coming soon")` |
| 3 | **Table — Download (row menu)** | `DropdownMenuItem` “Download” → `onSelect` → `toast.info("PDF download coming soon")`. Pass `row.id` into the handler for Phase 2 |
| 4 | **Table — Share (row menu)** | `DropdownMenuItem` “Share” → `onSelect` → same as Header “Public link” (copy `/student/profile` + toast) |

**Check:** Every Download and Share control has a handler and user feedback; no dead clicks.

---

### Phase 1 done

- [ ] Overview: preview column 3, edit 2; preview above on mobile  
- [ ] CV tab: preview 3, table 2; preview above on small screens; sticky preserved  
- [ ] Download (header + table): `onSelect` + toast  
- [ ] Share (header + table “Share”): copy link + toast  

---

## Phase 2: PDF Download + QR (Optional)

**Goal:** “Download CV” produces a PDF that matches the preview, with verified/non‑verified clarity and an optional verification link/QR.

**Why after Phase 1:** Layout and placeholders are done; PDF is the next highest-value, self-contained feature.

---

### 2.1 Choose PDF approach

| Option | Pros | Cons |
|--------|------|------|
| **html2pdf.js** | Renders existing DOM; PDF will match `StudentCVPreview` if you pass a clone | Need a hidden/print-only container; font/export quirks |
| **@react-pdf/renderer** | Good for structured docs; no DOM | Separate React tree; must mirror `StudentCVPreview` layout and styling |
| **Browser print → PDF** | No extra deps | Less control; not a one-click “Download” in the same way |

**Recommendation:** **html2pdf.js** (or similar, e.g. `jspdf` + `html2canvas`) so the PDF is generated from the same `StudentCVPreview` (or a dedicated “print” div that mirrors it). Keeps one source of truth for layout.

---

### 2.2 Add dependency and print view

| # | Task | Details |
|---|------|---------|
| 1 | Install | `npm install html2pdf.js` (or `jspdf` + `html2canvas`). For QR: `npm install qrcode` and optionally `qrcode.react` if you want a React component |
| 2 | **One dedicated print-only node** | In `StudentProfileClient`, add a **single** always-mounted node used only for PDF (e.g. a wrapper `div` with `ref={printRef}` containing `StudentCVPreview` + footer, or a `<StudentCVPrintView editable system targetRole versionName />`). Hide it off-screen (e.g. `absolute -left-[9999px]` or `invisible` + `aria-hidden`). Do **not** ref the on-screen `StudentCVPreview` instances in the Overview or CV tab—only one of those is mounted at a time, and they are not the PDF source. The dedicated node receives `editable`, `system`, `targetRole`, and `versionName` (for footer/filename) as props and stays in sync with state. When the PDF lib runs, it must see this node in the DOM; ensure it is not `display: none` (use `invisible` or off-screen positioning so layout still runs) |
| 3 | Footer block | Below the preview content in that print node, add a small footer: “Yiba Verified” + short line. If you have a public URL: “Verify at: [url]” and a QR; if not: “Verify at yiba.co.za” or “Verification link coming soon” as placeholder |

---

### 2.3 PDF generation helper

**New file:** `src/lib/cv-pdf.ts` (or `src/lib/pdf-cv.ts`)

| # | Task | Details |
|---|------|---------|
| 1 | `generateCvPdf(element: HTMLElement, filename: string): Promise<void>` | Use html2pdf (or jspdf+html2canvas) to turn `element` into a PDF and trigger `download` with `filename` |
| 2 | Filename | `{firstName}-{lastName}-YibaVerified-CV.pdf` or `{name}-CV-{versionName}.pdf`. Get name from `system.header.name` and optional version from the selected CV row. **Sanitise** name and `versionName` for filesystems: replace `\ / : * ? " < > |` and trim length to avoid download/HTTP issues |
| 3 | Options | `page-break` and margins so it doesn’t cut sections awkwardly; match aspect/format to a standard CV (e.g. A4). **Note:** PDF runs in the browser (e.g. inside `onDownloadCv`). Do not move this to an API route without switching to a server-side PDF approach (e.g. Puppeteer) |

---

### 2.4 Wire Download to PDF

**Files:** `StudentProfileHeader.tsx`, `StudentCVVersionsTable.tsx`, `StudentProfileClient.tsx`

| # | Task | Details |
|---|------|---------|
| 1 | **`onDownloadCv(cvIdOrOptionId?: string)` in `StudentProfileClient`** | Define a callback that takes `cvId` (from Table row) or `option.id` (from Header, e.g. `"primary"`, `"pm"`). The callback: (a) derives `targetRole` and `versionName` from `cvIdOrOptionId` and the CV list (e.g. `mockCVs`), or uses the selected row / first row / default when not specified; (b) ensures the **dedicated print node** (from 2.2) is rendered with that `targetRole` (and `versionName` for the footer). Because the print node is controlled by props, you must either: **Option A**—set state (e.g. `pdfRequest: { targetRole, versionName }`) so the print node re-renders, then in a `useEffect` when `pdfRequest` is set run `generateCvPdf(printRef.current, filename)` and clear `pdfRequest`; or **Option B**—render a one-off `StudentCVPreview` (and footer) into a temporary DOM node, run `generateCvPdf` on it, then remove it. (c) Build `filename` from `system.header.name` and `versionName`, sanitised. Pass `onDownloadCv` to `StudentProfileHeader` and to `StudentCVVersionsTable` (which forwards it to the row Download `onSelect`). The single `printRef` is only ever attached to the dedicated print-only node, never to the on-screen previews. |
| 2 | **Header — Download CV** | Replace the “coming soon” toast: `onSelect` → `onDownloadCv(option.id)`. |
| 3 | **Table — Download** | `onSelect` → `onDownloadCv(row.id)`. |

**Check:** Clicking “Primary CV” (or any option) and “Download” in the table produces a PDF that looks like the preview, with footer. Filename is sensible.

---

### 2.5 QR / verification line in PDF

| # | Task | Details |
|---|------|---------|
| 1 | When public URL exists | In the print view footer: add a small QR (from `qrcode` or `qrcode.react`) pointing to the public profile URL, and the text “Verify at: [short URL]” |
| 2 | When it doesn’t | Use placeholder text only: “Verify at yiba.co.za” or “Verification link coming soon”. No QR or a generic platform QR if you prefer |

**Check:** PDF footer is professional; QR appears when the public URL is available.

---

### Phase 2 done

- [ ] Dependency added (html2pdf or jspdf+html2canvas; optional qrcode)  
- [ ] Print view mirrors `StudentCVPreview`; footer with “Yiba Verified” and verify line/QR or placeholder  
- [ ] `generateCvPdf(element, filename)` in `src/lib/cv-pdf.ts`  
- [ ] Header “Download CV” and Table “Download” produce the PDF with correct name and content  
- [ ] Verified vs non‑verified in the PDF matches `StudentCVPreview` (no new rules in this phase)  

---

## Phase 3: Public Profile + Share Link

**Goal:** A shareable public URL that shows a read-only CV; Share copies that URL.

**Why after Phase 2:** PDF and QR can use the public URL once it exists; Share can be upgraded from “copy /student/profile” to “copy /p/xyz”.

---

### 3.1 Public profile route

| # | Task | Details |
|---|------|---------|
| 1 | Route | `src/app/p/[id]/page.tsx` (or `/profile/[id]`). `[id]` = stable, unguessable identifier. **For Phase 3 (mock):** use a fixed slug, e.g. `"demo"` or `"kagiso-botha"`—if `params.id === "demo"` (or your chosen slug), render; else `notFound()`. **Later:** `[id]` can be `learner_id` or a dedicated `profile_slug` once persisted. Document that `publicId` / `profile_slug` will be added when moving off mock. |
| 2 | Page content | Read-only: `StudentCVPreview` with `variant="full"`. Reuse the same data shape as `StudentProfileClient` (editable + system). For now, reuse mock or a `getProfileByPublicId(id)` that returns mock. **No auth:** the page is public; do not call `getServerSession` or require login. Link-only access: the unguessable `[id]` is the only “auth” (when real ids exist). |
| 3 | Hide contact | When `hideContact` is true (from mock or later API), omit or mask email/phone in the public view. `StudentCVPreview` may need a `hideContact?: boolean` prop; if it doesn’t show contact yet, this is a no-op until you add contact to the preview |
| 4 | Public flag | If `publicProfile` is false, the route can 404 or show “Profile is private”. For mock, assume `publicProfile === true` |

---

### 3.2 API for public profile (optional now)

If you want to avoid embedding mock in the page:

- `GET /api/p/[id]` → returns `{ editable, system, publicProfile, hideContact }`. For now can return mock; later replace with DB.  
- **Keep the route unauthenticated:** do not use `getServerSession` or middleware that requires login. `[id]` alone controls access (unguessable = link-only).  
- Page fetches and renders. If you’re fine with server-side mock in the page, you can skip the API in this phase.

---

### 3.3 Share copies public URL

**Files:** `StudentProfileHeader.tsx`, `StudentCVVersionsTable.tsx`. **Source of `publicId`:** `system.header` does not yet have `publicId`. For Phase 3, use a **fixed value** that matches the public route’s accepted `[id]` (e.g. `"demo"` if `/p/demo` is the mock). Document that `publicId` will come from `system.header.publicId` or `profile_slug` when the backend persists it.

| # | Task | Details |
|---|------|---------|
| 1 | Public URL | `origin + "/p/" + publicId`. **Mock:** `publicId = "demo"` (or whatever slug you use in 3.1). Later: from `system.header.publicId` or a `profile_slug` field when the API provides it. |
| 2 | Header — Share “Public link” | Copy `origin + "/p/" + publicId` and `toast.success("Public profile link copied")` |
| 3 | Table — Share | Same URL. If the row has a different “share” target later, you can extend; for now, one public profile per student |
| 4 | “Private link” | Optional: copy `origin + "/student/profile"` and toast “Private link copied (login required)”, or leave as “Coming soon” |

---

### 3.4 (Optional) Persist public/hide toggles

When `PATCH /api/student/profile` (or equivalent) exists:

- Add `publicProfile` and `hideContact` to the request body and DB.  
- Settings toggles in `StudentProfileClient` call that API on change.  
- Public page and Share read from the persisted values.  

If the API doesn’t exist yet, leave Settings as local state; document that Phase 3 assumes `publicProfile: true` for the demo.

---

### Phase 3 done

- [ ] `app/p/[id]/page.tsx` (or `/profile/[id]`) renders read-only CV; respects `hideContact` when in data; 404 or “private” when `publicProfile` is false  
- [ ] Share “Public link” (and Table “Share”) copies `origin + "/p/" + publicId` and shows success toast  
- [ ] (Optional) `GET /api/p/[id]` for data; (Optional) persist toggles when API exists  

---

## Phase 4: Polish — Nav, Dashboard, Optional Video

**Goal:** “My CV” / profile is easy to find; optional intro video only if it fits.

---

### 4.1 Nav label

**File:** `src/lib/navigation.ts`

| # | Task | Details |
|---|------|---------|
| 1 | Label | Change `"My Profile"` → `"My Profile & CV"` in `getStudentNavItems()`, or keep “My Profile” and add a child `{ label: "My CV", href: "/student/profile?tab=cv" }`. Pick one; both are low impact |

**Check:** Student nav clearly signals that the profile includes the CV.

---

### 4.2 Student dashboard card

**File:** `src/app/student/page.tsx`

| # | Task | Details |
|---|------|---------|
| 1 | Card | Add a `Card` similar to “My Enrolments”: title “My Profile & CV” or “My CV”, description “View and share your verified CV”, link “View” → `/student/profile` or `/student/profile?tab=cv` |
| 2 | Placement | Above or below “My Enrolments”; keep the same `Card`/link pattern for consistency |

**Check:** From the dashboard, one click to the profile/CV page.

---

### 4.3 Optional: Introduction video

Only if it fits cleanly:

| # | Task | Details |
|---|------|---------|
| 1 | Data | Add `introVideoUrl?: string | null` to the editable or system shape. No DB change in this plan; use mock or a TODO |
| 2 | Settings / Profile | In Overview or Settings: optional “Introduction video URL”. If empty, nothing; if set, show in preview |
| 3 | Preview | In `StudentCVPreview`, if `introVideoUrl`: small block with thumbnail or “Watch introduction” link. If absent, no block |
| 4 | PDF | In the print view: “Introduction: [URL]” or a QR for the video. No embedded video |

If this feels bolted-on, drop it from this phase.

---

### Phase 4 done

- [ ] Nav label or child “My CV” updated  
- [ ] Dashboard has a “My Profile & CV” / “My CV” card linking to `/student/profile`  
- [ ] (Optional) Intro video: optional field, preview block, PDF line/QR; or skipped  

---

## Dependencies Between Phases

```
Phase 1 (Layout + placeholders)  →  must be first
        ↓
Phase 2 (PDF)                    →  can use Phase 1’s wired Download; QR can wait for Phase 3’s URL
        ↓
Phase 3 (Public profile + Share) →  Share can use /p/[id]; PDF footer can use same URL for QR
        ↓
Phase 4 (Polish)                 →  independent; can be done in parallel with 2 or 3 if needed
```

- **Phase 1** unblocks 2 and 3 (no dead buttons; layout done).  
- **Phase 2** can be done with a placeholder verify line; Phase 3’s public URL improves the PDF footer.  
- **Phase 3** does not depend on Phase 2.  
- **Phase 4** can be done anytime after 1.

---

## Files Touched (Checklist)

| File | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|---------|---------|---------|---------|
| `StudentProfileClient.tsx` | ✓ | ✓ (ref, onDownloadCv) | — | — |
| `StudentProfileHeader.tsx` | ✓ | ✓ | ✓ | — |
| `StudentCVVersionsTable.tsx` | ✓ | ✓ (Download) | ✓ (Share) | — |
| `StudentCVPreview.tsx` | — | — | ✓ (hideContact?) | ✓ (intro?) |
| `src/lib/cv-pdf.ts` | — | ✓ (new) | — | — |
| `src/app/p/[id]/page.tsx` | — | — | ✓ (new) | — |
| `src/lib/navigation.ts` | — | — | — | ✓ |
| `src/app/student/page.tsx` | — | — | — | ✓ |
| `package.json` | — | ✓ (html2pdf, qrcode?) | — | — |

---

## Out of Scope in This Plan

- **Backend / DB:** No `GET /api/me`, `PATCH /api/me`, `CvVersion` model, or `Learner` schema changes.  
- **Certificates / Credentials / Workplace / Documents:** Only placeholders; no verified vs external logic until those features have real data.  
- **Pricing:** Not touched.  
- **Employer directory / search:** Deferred.

---

## Definition of Done (All Phases)

- [ ] **Layout:** Preview is the larger column in Overview and CV tabs; preview first on mobile.  
- [ ] **Buttons:** Download and Share have defined behaviour and feedback.  
- [ ] **PDF:** At least one Download path produces a PDF matching the preview, with verified clarity and a verify line or QR (or placeholder).  
- [ ] **Share:** “Public link” copies the public profile URL; public page shows a read-only CV.  
- [ ] **Polish:** Nav and dashboard make “My CV” / profile easy to find.  
- [ ] **Design:** Same design system; no new UI framework.  
- [ ] **Pricing:** Not surfaced.

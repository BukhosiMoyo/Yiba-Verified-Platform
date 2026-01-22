# CV PDF Export – Spec and Verification Prompt

## Purpose

This document defines how the **Student Profile CV PDF download** must behave and how to check that it works. The PDF must contain the **same details as the on-screen preview** (the `StudentCVPreview` component).

---

## Requirement: PDF Content Matches Preview

The exported PDF must include **exactly the same sections and data** as the live CV preview:

| Section | Source | Must include |
|--------|--------|--------------|
| **Header** | `system.header`, `editable.photoUrl` | Name, initials (or photo), target role, “Verified” badge, institution name, student ID |
| **Summary** | `editable.bio` | Full bio text |
| **Skills** | `editable.skills` | All skills as tags |
| **Projects** | `editable.projects` | Title, description, link (if any) for each project |
| **Qualifications** | `system.qualifications` | Title, NQF level, status for each |
| **Experience** | `system.workplaceEvidence.recent` | Workplace, role, date range for each |
| **Footer** | Fixed + `pdfRequest` / selected CV | “Yiba Verified”, verify URL, CV version name |

- The **target role** in the PDF must match the CV version being downloaded (header dropdown or table row).
- The **CV version name** in the filename and in the footer must match that selection.

---

## Technical Approach

1. **Single source of truth**  
   Both the on-screen preview and the PDF are rendered from the same component: `StudentCVPreview`, with the same props: `editable`, `system`, `targetRole`, and `variant="full"`.

2. **Dedicated print node**  
   In `StudentProfileClient`, a single off-screen node (`ref={printRef}`) holds:
   - `StudentCVPreview` with `editable`, `system`, `targetRole={pdfRequest?.targetRole ?? mockCVs[0]?.targetRole}`, `variant="full"`
   - A `<footer>` with “Yiba Verified”, verify URL, and version name.

3. **html2canvas and off-screen elements**  
   html2canvas can produce **empty or blank** output when the element is off-screen (e.g. `position: fixed; left: -9999px`).  
   **Fix:** For the PDF run only, **clone** the print node, position the clone **in the viewport** (e.g. `position: fixed; left: 0; top: 0; z-index: 99999`), append to `body`, run html2pdf on the clone, then remove the clone. The original stays off-screen.

4. **oklab/oklch**  
   html2canvas does not support `oklab`/`oklch` (e.g. from Tailwind 4). The `onclone` callback in `generateCvPdf` overrides color-related and color-containing CSS on the cloned DOM so `getComputedStyle` only returns supported values (hex/rgb). Pseudo-elements are handled via an injected `*::before, *::after` rule.

5. **Data flow**  
   - `handleDownloadCv(optionOrRowId)` → `setPdfRequest({ targetRole, versionName })`.
   - `useEffect` on `pdfRequest`: when set, run `generateCvPdf(printRef.current, { filename })` after a `requestAnimationFrame` so the print node has the correct `targetRole` and footer from the next render.

---

## Verification Steps (Manual)

Use these steps to confirm the PDF is **not empty** and **matches the preview**.

### 1. Open Student Profile

- Log in as a **student** (or use a demo student).
- Go to **My Profile & CV** (`/student/profile`).

### 2. Check the on-screen preview

- In **Overview** or **CV Versions**, note:
  - Name, target role, Verified badge, institution, student ID
  - Summary (bio)
  - Skills (all tags)
  - Projects (titles, descriptions, links if any)
  - Qualifications (titles, NQF, status)
  - Experience (workplaces, roles, dates)

### 3. Download PDF from header

- Click **Download** in the header and choose a CV option (e.g. “Primary CV”).
- Open the downloaded PDF.

**Check:**

- [ ] PDF opens and is **not empty** (no blank pages).
- [ ] **Header:** name, initials (or photo), target role, “Verified”, institution, student ID match the preview.
- [ ] **Summary:** same bio as on screen.
- [ ] **Skills:** same list as on screen.
- [ ] **Projects:** same projects, titles, descriptions (links may be plain text).
- [ ] **Qualifications:** same items, NQF, status.
- [ ] **Experience:** same workplaces, roles, date ranges.
- [ ] **Footer:** “Yiba Verified”, verify URL, and the chosen CV version name.

### 4. Download PDF from CV Versions table

- Go to the **CV Versions** tab.
- Select a row (e.g. “Support CV”).
- In the row, use **⋮ → Download** (or the row’s Download if present).

**Check:**

- [ ] PDF is **not empty**.
- [ ] **Target role** in the PDF matches the selected row (e.g. “Support” for “Support CV”).
- [ ] **Footer** shows the correct version name (e.g. “Support CV”).
- [ ] All other sections still match the current `editable` and `system` data as in the preview.

### 5. Change data and re-download

- In **Overview**, edit **About** (bio) or **Skills**, and/or ensure there are projects.
- Download the PDF again.

**Check:**

- [ ] PDF reflects the **updated** bio, skills, and projects; it is not cached from an older state.

---

## Common Failures and Fixes

| Symptom | Likely cause | Fix |
|--------|--------------|-----|
| **Empty or blank PDF** | Print node off-screen (`-left-[9999px]`); html2canvas skips it | In `generateCvPdf`, clone the node, position clone in viewport (`left:0; top:0`), capture from clone, then remove clone |
| **“Attempting to parse an unsupported color function oklab”** | Tailwind 4 / oklab in computed styles | `onclone` in html2pdf’s html2canvas options: override `color`, `background*`, `border*`, `box-shadow`, `text-shadow`, `background-image`, etc. with hex or `none`; add `*::before,*::after` overrides |
| **Wrong target role or version in PDF** | `pdfRequest` not yet applied to print node when capture runs | Run `generateCvPdf` inside `requestAnimationFrame` (or after a short delay) so React has committed `pdfRequest` and the print node has re-rendered |
| **PDF missing sections** | Print node uses different props than the visible preview | Ensure the print node uses the same `StudentCVPreview` with `editable`, `system`, `targetRole`, and `variant="full"` as the CV Versions preview |

---

## Files to Touch

- `src/lib/cv-pdf.ts` – `generateCvPdf`: clone, place in viewport, capture, remove; `onclone` for oklab.
- `src/components/student/StudentProfileClient.tsx` – print div (`printRef`), `StudentCVPreview` + footer, `pdfRequest` effect, `handleDownloadCv`.
- `src/components/student/StudentCVPreview.tsx` – shared layout and sections (no PDF-specific logic).

---

## Prompt for Implementation or Review

> **CV PDF export:** The Student Profile CV download must produce a PDF that contains the **same details as the on-screen preview** (name, target role, verified badge, bio, skills, projects, qualifications, experience, and the “Yiba Verified” footer with verify URL and version name).  
>
> **Checks:**  
> 1. The PDF must not be empty.  
> 2. The PDF must be generated from the same `StudentCVPreview` component and the same `editable` and `system` data as the visible preview.  
> 3. The `targetRole` and version name in the PDF and filename must match the chosen CV version (header or table row).  
> 4. html2canvas must not receive an off-screen element: either move the print node into the viewport for the capture, or clone it, place the clone in the viewport, capture from the clone, then remove it.  
> 5. The `onclone` workaround for oklab/oklch must remain so PDF generation does not throw.  
>
> Follow the verification steps in `docs/CV-PDF-EXPORT-SPEC.md` to confirm.

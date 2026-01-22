# Advanced Attendance Register — Product & Engineering Prompt

## 1. SCOPE

- **What:** An **advanced attendance register** that records **per-session/per-day** attendance (present, absent, excused, late), supports **sick notes with reasons and optional file attachments**, and exposes this data to **institutions** (capture + view), **QCTO** (view for oversight), and **students** (view own attendance and excused absences).
- **Why:** Critical for institutions to meet QCTO/EISA expectations and for QCTO to verify that learners are attending. Sick notes with reasons provide an auditable trail for excused absences.
- **Where:**
  - **Institution:** New section "Attendance Register" (nav + pages). Capture by date and by enrolment; mark present/absent/excused/late; attach sick notes to absences.
  - **QCTO:** View attendance when accessing an enrolment (via Submissions or QCTO Requests). No capture; read-only. Can appear in enrolment detail and reports.
  - **Student:** Enhanced `/student/attendance` — daily/session-level view, which days attended vs missed, and excused absences with reason (and optional sick note doc). Keep existing enrolment-level percentage as summary.
- **Preserve:** `Enrolment.attendance_percentage` remains as a **computed/denormalized** field, recalculated from `AttendanceRecord` when records change. Existing student attendance page behaviour (enrolment cards with %) is kept and extended with a "View details" / drill-down to the new day-level view.

---

## 2. DATA MODEL

### 2.1 New Models (Prisma)

```prisma
/// One row per learner per date per enrolment.
/// "Session" = one calendar day for that enrolment. Institutions can later extend to multiple sessions per day if needed.
model AttendanceRecord {
  record_id     String              @id @default(uuid())
  enrolment_id  String
  record_date   DateTime            @db.Date
  status        AttendanceStatus    // PRESENT | ABSENT | EXCUSED | LATE
  marked_at     DateTime            @default(now())
  marked_by     String
  notes         String?             @db.Text

  enrolment     Enrolment           @relation(fields: [enrolment_id], references: [enrolment_id], onDelete: Cascade)
  markedByUser  User                @relation(fields: [marked_by], references: [user_id])
  sickNote      SickNote?

  @@unique([enrolment_id, record_date])
  @@index([enrolment_id])
  @@index([record_date])
  @@index([status])
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  EXCUSED
  LATE
}

/// Optional sick note for an excused absence. One-to-one with an AttendanceRecord (only when status=EXCUSED).
/// Reason (text) is required; attachment (Document) is optional.
model SickNote {
  sick_note_id   String            @id @default(uuid())
  record_id      String            @unique
  reason         String            @db.Text
  document_id    String?           // Optional: links to Document (e.g. medical certificate scan)
  created_at     DateTime          @default(now())
  updated_at     DateTime          @updatedAt

  attendanceRecord AttendanceRecord @relation(fields: [record_id], references: [record_id], onDelete: Cascade)
  document         Document?        @relation("SickNoteDocument", fields: [document_id], references: [document_id], onDelete: SetNull)
}
```

- **Document:** Add relation `SickNoteDocument` on `Document` (optional back-relation). For the optional attachment, we can either:
  - **Option A:** New `DocumentRelatedEntity = ATTENDANCE_RECORD`, `related_entity_id = record_id`, `document_type = "SICK_NOTE"`. Then `SickNote.document_id` points to that Document. Clean separation.
  - **Option B:** Reuse `ENROLMENT` with `document_type = "SICK_NOTE"` and store `record_id` in a JSON/metadata or a `SickNote`-only `document_id` FK. Simpler for document upload flow but less explicit.
- **Recommendation:** **Option A**. Add `ATTENDANCE_RECORD` to `DocumentRelatedEntity`. When creating a SickNote with an attachment, create a `Document` with `related_entity=ATTENDANCE_RECORD`, `related_entity_id=record_id`, `document_type=SICK_NOTE`, and set `SickNote.document_id`. Document upload UI for "SICK_NOTE" can be used from the attendance flow when attaching a file to a sick note.

- **Enrolment:** Add `attendanceRecords AttendanceRecord[]` and keep `attendance_percentage`. The percentage is **recomputed** when records are added/updated/deleted:  
  `attendance_percentage = (PRESENT + LATE + EXCUSED) / total_records * 100` over the enrolment’s date range (or configurable "academic period"). EXCUSED counts as "attended" for the percentage. Document the exact formula in code comments.

- **User:** Add `attendanceMarkedBy AttendanceRecord[]` for `marked_by`.

### 2.2 DocumentRelatedEntity (add)

- Add `ATTENDANCE_RECORD` to the `DocumentRelatedEntity` enum.

### 2.3 Submission / QCTO access

- Attendance is **not** a separate `SubmissionResourceType`. When QCTO has access to an **Enrolment** (via `SubmissionResource` or `QCTORequestResource` with `ENROLMENT`), they may also load `AttendanceRecord` and `SickNote` (and linked `Document`) for that `enrolment_id`. No schema change to Submission/QCTORequest.

---

## 3. INSTITUTION: ATTENDANCE REGISTER

### 3.1 Navigation

- Add **"Attendance Register"** to institution nav (`getInstitutionNavItems`), e.g. after **"Enrolments"**:
  - `{ label: "Attendance Register", href: "/institution/attendance", iconKey: "clipboard-check", capability: "ATTENDANCE_CAPTURE" }`
- If `ATTENDANCE_VIEW` but not `ATTENDANCE_CAPTURE`, the same link can show read-only (or reuse with capability check in the page).

### 3.2 Routes and pages

| Route | Purpose |
|-------|---------|
| `/institution/attendance` | List/overview: filter by enrolment, date range, status. Table: Enrolment, Learner, Date, Status, Sick note (Y/N), Marked by, Marked at. Links to capture and to per-enrolment view. |
| `/institution/attendance/capture` | **Capture by date:** Pick a date, list active enrolments for the institution; bulk actions: Mark all present, then override individuals to ABSENT/EXCUSED/LATE. Per-row: status dropdown, "Add sick note" for ABSENT/EXCUSED (or only EXCUSED). Save writes `AttendanceRecord` (and optionally `SickNote`). |
| `/institution/attendance/enrolment/[enrolmentId]` | **Per-enrolment register:** Calendar or list of dates in range; each date shows status, sick note (reason + link to doc). Buttons: Edit, Add sick note (when EXCUSED/ABSENT). Useful for backfilling or correcting. |

### 3.3 Capture flow (by date)

- **Date picker:** Required. Default: today.
- **Learners:** Only ACTIVE enrolments for the institution whose `start_date <= date <= expected_completion_date` (or no end = open).
- **Bulk:** "Mark all present" for the selected date (creates/updates `AttendanceRecord` with `PRESENT`). Then staff can change individual rows to ABSENT, EXCUSED, or LATE.
- **Sick note:** For a row with ABSENT or EXCUSED, "Add sick note" opens a modal/sheet:
  - **Reason (required):** Text area, e.g. "Medical – flu", "Family bereavement", "Medical – as per attached certificate".
  - **Attachment (optional):** File upload. Stored as `Document` with `related_entity=ATTENDANCE_RECORD`, `related_entity_id=record_id`, `document_type=SICK_NOTE`. Linked in `SickNote.document_id`.
- If a `SickNote` exists for that record, show "Edit sick note" / "View" (reason + download for doc). Only one sick note per `AttendanceRecord`.

### 3.4 Per-enrolment register (`/institution/attendance/enrolment/[enrolmentId]`)

- **Date range:** e.g. last 3 months and next 2 weeks, or configurable. Show only dates within enrolment’s `start_date`–`expected_completion_date`.
- **View:** Table or calendar cells: Date, Status (badge), Sick note (reason snippet or "—"), Actions (Edit status, Add/Edit sick note).
- **Edits:** Inline or modal. Same rules: sick note only when ABSENT/EXCUSED; reason required; attachment optional.

---

## 4. QCTO: VIEW ATTENDANCE

- **Where:** In **enrolment detail** (e.g. `/qcto/enrolments/[enrolmentId]` or wherever QCTO sees an enrolment). Add a section **"Attendance"**:
  - Summary: `attendance_percentage`, date range of records, counts: Present, Absent, Excused, Late.
  - Table: Date, Status, Sick note reason (if any), Attachment (link if `SickNote.document_id` set). Read-only.
- **Access:** Only when QCTO has access to that enrolment (via an approved Submission including that ENROLMENT, or an approved QCTO Request including that ENROLMENT). Reuse existing enrolment-scoping logic.
- **Reports/Export:** If there is an enrolments or learners export, include attendance summary (e.g. percentage, number of absences, number of excused with sick notes). Optional: separate "Attendance export" for an enrolment or institution. Can be a follow-up.

---

## 5. STUDENT: ENHANCED ATTENDANCE VIEW

- **Route:** `/student/attendance` (existing). Extend, do not replace.
- **Keep:** Top-level cards per enrolment with `attendance_percentage` and progress bar (existing behaviour).
- **Add:** Per-enrolment **"View details"** (or "Attendance history") that shows:
  - **Date range:** e.g. current term or last 90 days (within enrolment dates).
  - **List/calendar:** For each date: Attended (Present/Late) vs Missed (Absent) vs **Excused** (with reason; "Sick note on file" if `SickNote.document_id` is set; no need to expose the actual file to student unless product decides otherwise—here we say only "Sick note on file").
- **Sick note:** Student sees **reason** and an indicator that a supporting document is on file. Download of the document can be allowed—specify in implementation; for the prompt, at minimum: reason + "Sick note on file".

---

## 6. COMPUTE `attendance_percentage` ON ENROLMENT

- **When:** On create/update/delete of `AttendanceRecord` for an `enrolment_id`. Use a small service/helper, e.g. `recomputeEnrolmentAttendancePercentage(enrolmentId)`.
- **Formula:**  
  - `total = count(AttendanceRecord where enrolment_id)` in the "effective" range (e.g. from `Enrolment.start_date` to `min(today, expected_completion_date)` or to the latest `record_date`).
  - `counted = count(AttendanceRecord where status in (PRESENT, LATE, EXCUSED))`.
  - `attendance_percentage = total > 0 ? round(counted / total * 100, 2) : null`.
- **Edge:** If `total === 0`, set `attendance_percentage = null`. Run in a transaction with the write to `AttendanceRecord` (and `SickNote`), or in a Prisma `$transaction` or post-write job. Prefer immediate update in same request for simplicity.

---

## 7. API

### 7.1 Institution (scoped by `institution_id` from session)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/institution/attendance` | List records. Query: `enrolment_id`, `from`, `to`, `status`. Returns `AttendanceRecord[]` with `sickNote` (and `sickNote.document` if needed). Paginate. |
| POST | `/api/institution/attendance` | Create or upsert records. Body: `{ enrolment_id, record_date, status, notes?, sick_note?: { reason, file? } }`. For `sick_note.file`, multipart or base64; create `Document` and `SickNote`. Recompute `attendance_percentage`. |
| PATCH | `/api/institution/attendance/[recordId]` | Update status, notes. Optional `sick_note: { reason, file? }` to add or replace. Recompute. |
| DELETE | `/api/institution/attendance/[recordId]` | Delete record (cascade to `SickNote`). Recompute. |
| GET | `/api/institution/attendance/enrolment/[enrolmentId]` | All records for an enrolment in a date range. Query: `from`, `to`. |

### 7.2 Student (scoped by learner’s enrolments)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/student/attendance` | Summary: enrolments with `attendance_percentage`. (Existing or extended.) |
| GET | `/api/student/attendance/enrolment/[enrolmentId]` | Records for that enrolment (only if `learner_id` owns it). Include `sickNote.reason` and `sickNote.document_id` (or "has_attachment") for "Sick note on file". No file URL unless we add a secure download. |

### 7.3 QCTO (scoped by submission/request-based access to enrolment)

- Reuse or extend existing enrolment fetch. When QCTO loads an enrolment to which they have access, include:
  - `attendance_percentage`
  - `attendanceRecords` (with `sickNote.reason`, `sickNote.document` for link to download).  
- Or: **GET /api/qcto/enrolments/[enrolmentId]/attendance** with the same access checks as the enrolment. Returns `{ attendance_percentage, records: AttendanceRecord[] }`.

---

## 8. CAPABILITIES & RBAC

- **ATTENDANCE_CAPTURE:** Institution staff who can mark attendance and add sick notes. Already in `capabilities.ts` for `INSTITUTION_ADMIN`, `INSTITUTION_STAFF`, `PLATFORM_ADMIN`.
- **ATTENDANCE_VIEW:** View attendance (institution, QCTO, student self). Already defined.
- Enforce in API: institution routes use `ctx.institutionId`; student routes ensure `enrolment.learner_id` matches the student’s `learner_id`; QCTO routes ensure the enrolment is allowed via `SubmissionResource` / `QCTORequestResource`.

---

## 9. AUDIT

- **AuditLog:** Log create/update/delete of `AttendanceRecord` and create/update/delete of `SickNote`. `entity_type` = new value `ATTENDANCE_RECORD` (and optionally `SICK_NOTE` if you want separate; or map both to `ATTENDANCE_RECORD`). `entity_id` = `record_id`. Include `reason` when provided. For document upload linked to sick note, existing Document audit may suffice; no need to duplicate if Document is already audited.

- Add `ATTENDANCE_RECORD` (and optionally `SICK_NOTE`) to `AuditEntityType` if we add new entity types.

---

## 10. FILES TO CREATE OR MODIFY

### 10.1 Schema and migrations

- **Modify:** `prisma/schema.prisma`  
  - Add `AttendanceRecord`, `AttendanceStatus`, `SickNote`.  
  - Add `DocumentRelatedEntity.ATTENDANCE_RECORD`.  
  - Add `Enrolment.attendanceRecords`, `User.attendanceMarkedBy`.  
  - On `Document`, add optional `sickNoteDocument SickNote?` if `SickNote.document_id` is a FK to `Document` (recommended).
- **Create:** Migration for the new models and enum.

### 10.2 Institution

- **Create:** `src/app/institution/attendance/page.tsx` — list/overview with filters.
- **Create:** `src/app/institution/attendance/capture/page.tsx` — capture by date.
- **Create:** `src/app/institution/attendance/enrolment/[enrolmentId]/page.tsx` — per-enrolment register.
- **Create:** `src/components/institution/AttendanceCaptureTable.tsx` (or similar) — table with status dropdown, sick note button, bulk "Mark all present".
- **Create:** `src/components/institution/SickNoteForm.tsx` — reason (required), optional file upload; used in modal/sheet.
- **Modify:** `src/lib/navigation.ts` — add "Attendance Register" to `getInstitutionNavItems`.

### 10.3 API

- **Create:** `src/app/api/institution/attendance/route.ts` — GET list, POST create/upsert.
- **Create:** `src/app/api/institution/attendance/[recordId]/route.ts` — PATCH, DELETE.
- **Create:** `src/app/api/institution/attendance/enrolment/[enrolmentId]/route.ts` — GET by enrolment.
- **Create or extend:** `src/app/api/student/attendance/route.ts` — extend for summary; **create** `src/app/api/student/attendance/enrolment/[enrolmentId]/route.ts` for day-level.
- **Create or extend:** `src/app/api/qcto/enrolments/[enrolmentId]/route.ts` or **create** `src/app/api/qcto/enrolments/[enrolmentId]/attendance/route.ts` — GET attendance for QCTO (with enrolment access check).

### 10.4 Student

- **Modify:** `src/app/student/attendance/page.tsx` — add "View details" / "Attendance history" and call to `GET /api/student/attendance/enrolment/[enrolmentId]`; render list with status, excused reason, "Sick note on file".

### 10.5 QCTO

- **Modify:** `src/app/qcto/enrolments/[enrolmentId]/page.tsx` (or equivalent) — add "Attendance" section with summary and table (dates, status, sick note reason, attachment link). Fetch from `GET /api/qcto/enrolments/[enrolmentId]/attendance` or embedded in enrolment.

### 10.6 Shared / lib

- **Create:** `src/lib/attendance.ts` (or `src/lib/attendance-service.ts`) — `recomputeEnrolmentAttendancePercentage(enrolmentId)`, and any shared constants (status labels, date range helpers).

### 10.7 Document upload

- **Modify:** `DocumentUploadForm` or institution document API: support `related_entity=ATTENDANCE_RECORD` and `document_type=SICK_NOTE` when called from the attendance flow. Alternatively, handle sick note file only inside the attendance API (simpler: one less place to change in the generic doc form).

---

## 11. BEHAVIOUR TO KEEP

- Enrolment cards on `/student/attendance` with `attendance_percentage` and bar.
- `Enrolment.attendance_percentage` used everywhere it is today (enrolment detail, learner detail, reports, QCTO). It is now maintained by `recomputeEnrolmentAttendancePercentage` instead of manual edits.
- `ATTENDANCE_CAPTURE` and `ATTENDANCE_VIEW` capability checks in nav and API.
- Institution and QCTO scoping: institution_id and submission/request-based access.

---

## 12. SICK NOTE REASONS (UI)

- **Free text** is required. Optionally, provide **suggested reasons** (dropdown or chips) for speed, e.g.:
  - "Medical – illness"
  - "Medical – as per attached certificate"
  - "Family bereavement"
  - "Official / legal appointment"
  - "Transport / accident"
  - "Other"
- "Other" or a custom option can expand to a text field. Stored in `SickNote.reason` as plain text.

---

## 13. RESPONSIVENESS & A11Y

- Tables: responsive (horizontal scroll on small screens or card layout).
- Modals/sheets: focus trap, Escape to close, `aria-label` for "Add sick note", "Mark all present", status dropdowns.
- Date picker: accessible; use existing `components/ui` date component if available.

---

## 14. IMPLEMENTATION ORDER (RECOMMENDED)

1. **Schema:** `AttendanceRecord`, `SickNote`, `AttendanceStatus`, `DocumentRelatedEntity.ATTENDANCE_RECORD`, relations. Migration.
2. **Lib:** `recomputeEnrolmentAttendancePercentage`, hook it into a trigger or call from API.
3. **API (Institution):** `POST/GET /api/institution/attendance`, `PATCH/DELETE /api/institution/attendance/[recordId]`, `GET /api/institution/attendance/enrolment/[enrolmentId]`. Implement sick note (reason + optional Document) in POST/PATCH.
4. **Institution UI:** Capture page (by date) and `AttendanceCaptureTable`, `SickNoteForm`. Then list page and per-enrolment page.
5. **Nav:** Add "Attendance Register" for institution.
6. **Student API + UI:** `GET /api/student/attendance/enrolment/[enrolmentId]`, extend `/student/attendance` with "View details".
7. **QCTO API + UI:** `GET /api/qcto/enrolments/[enrolmentId]/attendance` (or embedded), add Attendance section to enrolment detail.
8. **Audit:** `AuditEntityType.ATTENDANCE_RECORD`, log creates/updates/deletes for `AttendanceRecord` and `SickNote`.
9. **Seed (optional):** Add sample `AttendanceRecord` and `SickNote` in `seed.demo.ts` for one enrolment.

---

## 15. EDGE CASES

- **Duplicate date for same enrolment:** `@@unique([enrolment_id, record_date])` — upsert on conflict (update status/sick note).
- **Change status from EXCUSED to PRESENT:** Remove or null out `SickNote` for that record (or leave it for history; recommend: delete `SickNote` when status is no longer EXCUSED/ABSENT to avoid orphaned reasons).
- **Date range for "effective" attendance:** Use `Enrolment.start_date` to `min(today(), expected_completion_date ?? today())` for the percentage. If `expected_completion_date` is null, use `today()` or the max `record_date` in the table.
- **Document storage for sick note:** Reuse existing Document storage (S3 or local). `storage_key` and `file_name` as per current Document flow.

---

## 16. SUMMARY

| Actor | Capture | View (list/detail) | Sick note (add/edit) |
|-------|---------|--------------------|----------------------|
| Institution (staff) | Yes: by date, by enrolment | Yes: list, per-enrolment, per-date | Yes: reason required, attachment optional |
| QCTO | No | Yes: with enrolment (when allowed) | No (read-only) |
| Student | No | Yes: own enrolments, day-level, excused + "Sick note on file" | No |

**Data:** `AttendanceRecord` (enrolment, date, status, marked_by, notes) + `SickNote` (reason, optional `document_id`). `Enrolment.attendance_percentage` computed from records. `DocumentRelatedEntity.ATTENDANCE_RECORD` for sick note attachments.

This prompt is intended to be used as the single spec for implementing the advanced attendance register so it works seamlessly across institution, QCTO, and student experiences.

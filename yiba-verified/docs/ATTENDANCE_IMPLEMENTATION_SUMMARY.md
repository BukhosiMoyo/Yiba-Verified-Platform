# Advanced Attendance Register — Implementation Summary

## What Was Built

### 1. Schema (Prisma)
- **`AttendanceRecord`**: `enrolment_id`, `record_date`, `status` (PRESENT | ABSENT | EXCUSED | LATE), `marked_by`, `notes`. Unique on `(enrolment_id, record_date)`.
- **`SickNote`**: `record_id` (1:1 with record), `reason` (required), `document_id` (optional, for medical certificate etc.).
- **`DocumentRelatedEntity`**: added `ATTENDANCE_RECORD`.
- **`AuditEntityType`**: added `ATTENDANCE_RECORD`.
- **`Enrolment`**: `attendanceRecords` relation. `attendance_percentage` is **recomputed** from records.

### 2. Library
- **`src/lib/attendance.ts`**: `recomputeEnrolmentAttendancePercentage(db, enrolmentId)`. Formula: (PRESENT + LATE + EXCUSED) / total × 100. EXCUSED counts as attended.

### 3. APIs (Institution)
- **`GET /api/institution/attendance`**: List records, filters: `enrolment_id`, `from`, `to`, `status`. Pagination. Institution-scoped.
- **`POST /api/institution/attendance`**: Body `{ enrolment_id, record_date, status, notes?, sick_note?: { reason } }`. Upserts; supports sick note reason. Recomputes `attendance_percentage`.
- **`GET /api/institution/attendance/[recordId]`**: One record.
- **`PATCH /api/institution/attendance/[recordId]`**: Update status, notes, sick_note. Recomputes.
- **`DELETE /api/institution/attendance/[recordId]`**: Delete record (cascades SickNote). Recomputes.
- **`GET /api/institution/attendance/enrolment/[enrolmentId]`**: Records for one enrolment, optional `from`/`to`.

### 4. Institution UI
- **Nav**: "Attendance Register" (`/institution/attendance`) after Enrolments, capability `ATTENDANCE_VIEW`, icon `clipboard-check`.
- **`/institution/attendance`**: List with filters (URL: `?from=&to=&status=&enrolment_id=`). Links to Capture and to per-enrolment Register.
- **`/institution/attendance/capture`**: Date picker (URL `?date=YYYY-MM-DD`), table of ACTIVE enrolments for that date. Status select (PRESENT/ABSENT/EXCUSED/LATE), optional "Sick note reason" for ABSENT/EXCUSED. "Mark all present", "Save all". Uses `AttendanceCaptureClient`.
- **`/institution/attendance/enrolment/[enrolmentId]`**: Per-enrolment register (date, status, notes, sick note). Read-only; "Capture attendance" for edits.

### 5. Student UI
- **`/student/attendance`**: Existing enrolment cards with %; each has **"View details"** → `/student/attendance/enrolment/[enrolmentId]`.
- **`/student/attendance/enrolment/[enrolmentId]`**: Day-level list (Attended / Absent / Excused, sick note reason and "Sick note on file").

### 6. QCTO UI
- **`/qcto/enrolments/[enrolmentId]`**: New **"Attendance register"** card: summary (%, counts), table (date, status, sick note/reason, attachment on file). Read-only.

### 7. Audit
- `mutateWithAudit` in institution attendance API uses `entityType: "ATTENDANCE_RECORD"`. Create/update/delete of records (and implied sick note changes) are audited.

### 8. Seed (Demo)
- **`prisma/seed.demo.ts`**: After institution/enrolments, for ~8 ACTIVE enrolments: 5–12 `AttendanceRecord` rows over a date range, mixed statuses; one `SickNote` (e.g. "Medical – flu (demo)"). Calls `recomputeEnrolmentAttendancePercentage`. Import: `../src/lib/attendance`.

---

## Files Touched / Added

| Path | Role |
|------|------|
| `prisma/schema.prisma` | AttendanceRecord, SickNote, enums, relations |
| `prisma/migrations/..._add_attendance_register_sick_notes/` | Migration |
| `src/lib/attendance.ts` | **NEW** – recompute |
| `src/app/api/institution/attendance/route.ts` | **NEW** – GET, POST |
| `src/app/api/institution/attendance/[recordId]/route.ts` | **NEW** – GET, PATCH, DELETE |
| `src/app/api/institution/attendance/enrolment/[enrolmentId]/route.ts` | **NEW** – GET |
| `src/app/institution/attendance/page.tsx` | **NEW** – list |
| `src/app/institution/attendance/capture/page.tsx` | **NEW** – capture |
| `src/app/institution/attendance/enrolment/[enrolmentId]/page.tsx` | **NEW** – per-enrolment |
| `src/components/institution/AttendanceCaptureClient.tsx` | **NEW** – capture table/form |
| `src/app/student/attendance/page.tsx` | "View details" links |
| `src/app/student/attendance/enrolment/[enrolmentId]/page.tsx` | **NEW** – student day-level |
| `src/app/qcto/enrolments/[enrolmentId]/page.tsx` | Attendance section |
| `src/lib/navigation.ts` | Attendance Register nav |
| `src/components/layout/Sidebar.tsx` | `clipboard-check` icon |
| `src/server/mutations/mutate.ts` | `record_id` in entityId fallback |
| `prisma/seed.demo.ts` | Attendance + sick note demo data |

---

## Fixes Applied During Implementation

1. **POST upsert**: Use `findFirst({ where: { enrolment_id, record_date } })` instead of `findUnique` with compound key to avoid Prisma client naming differences.
2. **Capture page**: `orderBy: { created_at: "asc" }` instead of `{ learner: { last_name: "asc" } }` to avoid relation-based ordering issues.
3. **Seed**: `markedBy` falls back to `iu.admin.user_id` when `iu.staff` is empty; import `../src/lib/attendance`; `instIdsForAttendance` to avoid `demoInstIds` clash.

---

## Not Implemented (Per Spec or Deferred)

- **Sick note file attachment**: `SickNote.document_id` and `Document` with `ATTENDANCE_RECORD` exist; UI and API for uploading a file when adding a sick note are not wired. PATCH could be extended to accept `multipart/form-data` and create a `Document` for `record_id`.
- **Bulk "Mark all present" API**: Capture UI sends one POST per enrolment. A dedicated `POST /api/institution/attendance/bulk` would reduce round-trips.
- **Student download of sick note document**: Students see "Sick note on file"; no download link yet.

---

## Pre-Existing Build Blockers (Unchanged)

These are **not** part of the attendance work; they prevent `npm run build` from passing:

- **`@/lib/api/mutateWithAudit`** missing (used by `institutions/documents`, `qcto/documents`, `qcto/readiness/.../review`). Those routes expect `(ctx, { action, entityType, entityId, fn })`; `@/server/mutations/mutate` uses `({ ctx, entityType, changeType, fieldName, assertCan, mutation })`. An adapter or refactor of those call sites is needed.
- **`@aws-sdk/client-s3`**, **`@aws-sdk/s3-request-presigner`** missing (used by `src/lib/storage.ts`).
- **`resend`** missing (used by `src/lib/email.ts`).

Attendance routes use **`@/server/mutations/mutate`** only; they do not depend on `@/lib/api/mutateWithAudit`, `storage`, or `email`.

---

## How to Run

1. **Migration**: `npx prisma migrate dev` (if not already applied).
2. **Demo seed**: `DEMO_MODE=true npx tsx prisma/seed.ts` (or `prisma/seed.demo.ts` if invoked directly). Creates sample attendance and sick notes.
3. **Dev**: `npm run dev`. As institution user: **Attendance Register** → **Capture attendance**; as student: **Attendance** → **View details**; as QCTO: enrolment detail → **Attendance register** section.

---

## Capabilities

- **ATTENDANCE_VIEW**: nav and read APIs (institution, QCTO, student).
- **ATTENDANCE_CAPTURE**: POST/PATCH/DELETE and capture UI (institution only).

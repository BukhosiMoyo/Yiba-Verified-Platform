# Attendance System Implementation Plan (Phase 2 Design)

## 1. Data Model (Prisma)

### New Models

#### `Cohort`
Groups learners into a specific intake/class for a qualification.
```prisma
model Cohort {
  cohort_id        String   @id @default(uuid())
  institution_id   String
  qualification_id String
  name             String   // e.g., "Plumbing Intake Feb 2026"
  start_date       DateTime?
  end_date         DateTime?
  status           String   @default("ACTIVE") // ACTIVE, COMPLETED, ARCHIVED
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
  
  institution   Institution   @relation(fields: [institution_id], references: [institution_id])
  qualification Qualification @relation(fields: [qualification_id], references: [qualification_id])
  learners      Learner[]     // Access via implicit m-n or explicit join if needed (Enrolment is better?)
  // Actually, Enrolment links Learner to Qualification. 
  // We need to link Enrolment to Cohort. 
  enrolments    Enrolment[] 
  sessions      ClassSession[]
  
  @@index([institution_id])
}
```
*Note*: We will add `cohort_id` to the `Enrolment` model to link learners to a cohort.

#### `ClassSession` (Avoids `Session` conflict)
Represents a specific scheduled class/training event.
```prisma
model ClassSession {
  session_id      String   @id @default(uuid())
  cohort_id       String
  date            DateTime
  start_time      String?  // "08:00"
  end_time        String?  // "10:00"
  session_type    SessionType @default(THEORY)
  location        String?
  notes           String?
  is_locked       Boolean  @default(false)
  locked_at       DateTime?
  locked_by_user_id String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  cohort          Cohort   @relation(fields: [cohort_id], references: [cohort_id])
  attendanceRecords AttendanceRecord[]

  @@index([cohort_id])
  @@index([date])
}

enum SessionType {
  THEORY
  PRACTICAL
  WBL
  ASSESSMENT
  ORIENTATION
  OTHER
}
```

### Updates to Existing Models

#### `AttendanceRecord`
Shift from Enrolment-Daily to Session-Student.
```prisma
model AttendanceRecord {
  // ... existing fields ...
  record_id    String           @id @default(uuid())
  enrolment_id String
  record_date  DateTime         @db.Date // KEEP for legacy support + easy querying
  status       AttendanceStatus
  
  // NEW FIELDS
  session_id   String?          // Link to ClassSession (Optional for legacy/migration)
  minutes_late Int?             
  
  // RELATIONS
  classSession ClassSession?    @relation(fields: [session_id], references: [session_id])
  
  // INDEX UPDATE
  // Current: @@unique([enrolment_id, record_date])
  // New: We might need to relax this if multiple sessions occur on same day. 
  // BUT: If session_id is present, unique on [enrolment_id, session_id].
  // If session_id is null, unique on [enrolment_id, record_date].
  // Constraints will need careful management.
}
```

#### `Enrolment`
- Add `cohort_id` (FK to Cohort).

#### `SubmissionResourceType` (Enum)
- Add `ATTENDANCE_REGISTER`.

---

## 2. API Routes Structure

- `GET /api/institution/cohorts` - List cohorts
- `GET /api/institution/cohorts/[id]` - Details + stats
- `POST /api/institution/cohorts` - Create cohort
- `GET /api/institution/attendance/calendar` - Calendar events (sessions)
- `GET /api/institution/class-sessions/[id]` - Get session + register (learners + statuses)
- `POST /api/institution/attendance/mark` - **Bulk Mark** endpoint. 
  - Body: `{ session_id, records: [{ enrolment_id, status, notes }] }`
  - Handles "Mark All Present" by defaulting missing records to PRESENT.

---

## 3. Component Architecture

### Pages
- **Cohorts List**: `/institution/attendance/cohorts` names/dates/progress.
- **Calendar**: `/institution/attendance/calendar`
- **Session Register**: `/institution/attendance/sessions/[sessionId]`
  - **`RegisterTable`**: The core interactive grid.
  - **`AttendanceToolbar`**: "Mark All Present", "Lock", "Export".
  - **`EvidenceUpload`**: Dialog to upload sick note for a record.

### Key UX Decisions
- **Optimistic UI**: Marking attendance should be instant locally, then sync.
- **Bulk Actions**: Essential requirement.

---

## 4. RBAC & Security

- **Institution Admin**: Full access.
- **Facilitator**: 
  - Can View/Mark sessions for *their* assigned Cohorts (need to add `facilitator_id` to Cohort or Session? User said "Facilitator can mark attendance only for cohorts they’re assigned to").
  - **Action**: Add `facilitators Facilitator[]` (m-n) to `Cohort`.
- **QCTO**: Request-based access only.

## 5. Migration Strategy

1.  **Deploy Schema**: Add `Cohort`, `ClassSession`, optional `session_id`.
2.  **Code Update**: Update UI to read from `ClassSession` for new features.
3.  **Legacy View**: Keep `/institution/attendance` (Daily View) working by querying `AttendanceRecord` directly (ignoring session_id if null).
4.  **No Data Loss**: Old records stay as "Daily Records" without session. New records are "Session Records".

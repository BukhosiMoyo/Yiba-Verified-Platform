# Attendance Audit Findings (Phase 1)

## 1. Existing Work
### Data Models (Prisma)
- **`AttendanceRecord`**: Currently exists but is **Daily-based**, not Session-based.
  - Linked to `Enrolment` (one record per student per day).
  - Statuses: `PRESENT`, `ABSENT`, `EXCUSED`, `LATE`.
  - fields: `record_date` (Date only), `marked_by`, `notes`.
- **`SickNote`**: Exists, linked 1:1 with `AttendanceRecord`.
- **`Session`**: **CONFLICT**. Currently used for `next-auth` session management.
- **`Cohort`**: **MISSING**. No grouping of learners beyond `Enrolment` -> `Qualification` connection.
- **`Facilitator`**: Exists, but linked to `Readiness` and `ModuleCompletion`, not `Cohort`.
- **`QCTORequest`**: Exists, but lacks `ATTENDANCE` as a resource type.

### UI & Routes
- **/institution/attendance**: Existing "Attendance Register" page.
  - Displays a flat list of daily records.
  - Functionality: Filter by date/learner. "Capture attendance" button exists.
  - **Risk**: This UI assumes daily records. Transitioning to sessions will break this if not handled carefully.

### Roles (RBAC)
- **`FACILITATOR`**: Exists in `UserRole`.
- **Permissions**: Defined in `src/lib/rbac.ts`. `FACILITATOR` access is currently `["facilitator", "account", "announcements"]`.
- **Institution Staff**: `INSTITUTION_STAFF` exists.

## 2. Conflicts & Risks
1.  **Naming Collision (`Session`)**: The name `Session` is taken by `next-auth`.
    -   **Resolution**: Use `ClassSession` or `TrainingSession` for the new attendance model.
2.  **Data Model Shift (Daily vs Session)**:
    -   Current: 1 Record per Day per Student.
    -   Goal: 1 Record per Session per Student (allowing multiple sessions per day).
    -   **Risk**: Existing data (daily records) will not map 1:1 to new sessions unless we create "Dummy Daily Sessions" for past data during migration.
3.  **UI Breakage**: 
    -   The current `/institution/attendance` page relies on `record_date`. It will need to be rewritten to support `ClassSession`.

## 3. Recommended Approach

### Data Structures
- **Create `Cohort`**: New model to group learners (Intake/Class).
- **Create `ClassSession`**: New model (instead of `Session`). Links to `Cohort`.
- **Update `AttendanceRecord`**: 
  - **ADD** `session_id` (FK to `ClassSession`).
  - **KEEP** `record_date` (denormalize from session for easier querying/compat, or make optional).
  - **MIGRATE**: Existing records will remain valid if we make `session_id` nullable OR backfill "Daily Default Sessions".
  - *Recommendation*: Make `session_id` nullable for now to support legacy records, but enforce it for new UI.

### Phase Plan Refinement
- **Phase 2 (Data)**: strict naming `ClassSession`. Add `Cohort`.
- **Phase 3 (UI)**: Build *new* views alongside old ones to prevent breakage.
  - New route: `/institution/attendance/cohorts` (as requested).
  - Old route: `/institution/attendance` can remain as a "Daily View" or be redirected.

### QCTO Request Integration
- **Extend `SubmissionResourceType`**: Add `ATTENDANCE_REGISTER`.
- **Update QCTO Workflow**: Allow requesting `ATTENDANCE_REGISTER` types.

## 4. Immediate Next Steps
1.  Approve this audit.
2.  Proceed to Phase 2: Create `Cohort` and `ClassSession` models.

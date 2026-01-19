\# Wireframe V1 -- Workflows

\*\*Project:\*\* Yiba Wise -- Compliance & QCTO Oversight App

\*\*Version:\*\* v1.0

\*\*Date:\*\* 2026-01-14

\*\*Depends on:\*\*

\- Wireframe-V1-Overview.md

\- Wireframe-V1-Screens.md

\- Wireframe-V1-Forms-Fields.md

\*\*Status:\*\* Approved for implementation reference

\-\--

\## 1. Purpose of This Document

This document defines \*\*all core workflows and state transitions\*\*
for Version 1 of the Compliance & QCTO Oversight App.

It ensures:

\- Predictable system behaviour

\- Clear responsibilities per role

\- Consistent audit logging

\- No hidden or undefined states

\-\--

\## 2. Global Workflow Rules

\- Every workflow change must be auditable

\- State changes must be timestamped

\- Role-based permissions apply at every step

\- Rejected or flagged items must include remarks

\- Historical states must remain viewable

\-\--

\## 3. User & Institution Onboarding Workflow

\### 3.1 Institution Registration

\*\*States\*\*

1\. Draft

2\. Submitted for Approval

3\. Approved

4\. Rejected

5\. Suspended

\*\*Flow\*\*

\- Institution signs up → Draft

\- Completes institution profile

\- Submits for approval → Submitted for Approval

\- Admin reviews:

\- Approve → Approved

\- Reject → Rejected (remarks required)

\- Admin may later suspend → Suspended

\*\*Notes\*\*

\- Institution cannot add learners or submit readiness until Approved

\- All decisions logged in audit trail

\-\--

\### 3.2 Staff User Invitation (Institution)

\*\*States\*\*

\- Invited

\- Active

\- Deactivated

\*\*Flow\*\*

\- Institution Admin invites staff user

\- User accepts invite → Active

\- Admin can deactivate access at any time

\-\--

\## 4. Programme Delivery Readiness (Form 5) Workflow

\### 4.1 Readiness Status States

1\. Not Started

2\. In Progress

3\. Ready for Review

4\. Under QCTO Review

5\. Recommended

6\. Not Recommended

\-\--

\### 4.2 Readiness Completion Flow

\- Institution selects qualification → Not Started

\- Captures data + uploads evidence → In Progress

\- System validates mandatory sections

\- Institution submits → Ready for Review

\- QCTO opens submission → Under QCTO Review

\- QCTO decision:

\- Recommended

\- Not Recommended (remarks required)

\-\--

\### 4.3 Readiness Resubmission

\- If Not Recommended:

\- Institution updates flagged sections

\- Evidence versions retained

\- Resubmits → Ready for Review

\- Previous outcomes remain visible

\-\--

\## 5. Evidence & Document Management Workflow

\### 5.1 Evidence Upload

\*\*States\*\*

\- Uploaded

\- Flagged

\- Accepted

\- Replaced (versioned)

\*\*Flow\*\*

\- User uploads document → Uploaded

\- QCTO reviews:

\- Accept → Accepted

\- Flag → Flagged (remarks required)

\- Institution uploads replacement → Replaced

\- Previous versions retained

\-\--

\### 5.2 Document Versioning Rules

\- Each replacement increments version number

\- Older versions are read-only

\- Version history visible to QCTO and Admin

\-\--

\## 6. Learner Management Information System (LMIS) Workflow

\### 6.1 Learner Creation

\*\*States\*\*

\- Draft

\- Active

\- Archived

\*\*Flow\*\*

\- Institution creates learner → Draft

\- Completes mandatory fields + POPIA consent

\- Saves → Active

\- Learner may be archived (never deleted)

\-\--

\### 6.2 Learner Enrolment Workflow

\*\*States\*\*

\- Enrolled

\- Active

\- Completed

\- Transferred

\- Withdrawn

\*\*Flow\*\*

\- Institution enrols learner → Enrolled

\- Training starts → Active

\- Training ends → Completed

\- Learner moves institution → Transferred

\- Learner exits programme → Withdrawn

\-\--

\### 6.3 Multi-Institution Learner Flow

\- Learner profile is unique (National ID)

\- Enrolments are institution-specific

\- Learner may have multiple concurrent enrolments

\- History remains intact across institutions

\-\--

\## 7. Attendance & Readiness (EISA) Workflow

\### 7.1 Attendance Capture

\*\*Flow\*\*

\- Institution captures attendance records

\- Attendance linked to enrolment

\- Attendance edits generate audit entries

\-\--

\### 7.2 Learner Readiness for EISA

\*\*States\*\*

\- Not Assessed

\- Partially Ready

\- Ready

\- Submitted

\*\*Flow\*\*

\- Institution captures readiness indicators

\- Supporting evidence uploaded

\- Readiness marked → Ready

\- Submission recorded → Submitted

\-\--

\## 8. QCTO Review & Oversight Workflow

\### 8.1 Review Actions

QCTO users may:

\- View data

\- Review evidence

\- Add remarks

\- Flag records

\- Record recommendations

QCTO users \*\*cannot edit\*\* institutional or learner data.

\-\--

\### 8.2 Flag Resolution Workflow

\*\*States\*\*

\- Flagged

\- Addressed

\- Closed

\*\*Flow\*\*

\- QCTO flags item → Flagged

\- Institution addresses issue → Addressed

\- QCTO reviews → Closed

\-\--

\## 9. Audit Trail Workflow

\### 9.1 Audit Trigger Events

Audit logs are generated when:

\- Any field value changes

\- Evidence is uploaded or replaced

\- Status changes occur

\- Users are created, modified, or deactivated

\-\--

\### 9.2 Audit Visibility

\- Admin: Full access

\- QCTO: Read-only access

\- Institution: Own records only

\- Students: No audit access

\-\--

\## 10. Student Workflow (Minimal)

\### 10.1 Student Account Access

\*\*Flow\*\*

\- Student account created

\- Student logs in

\- Views profile, enrolments, certificates

Students cannot:

\- Edit enrolment records

\- Edit readiness or compliance data

\-\--

\## 11. Notifications Workflow (V1)

\*\*Triggers\*\*

\- Submission sent to QCTO

\- Evidence flagged

\- Readiness status changed

\- Institution approved or rejected

\*\*Delivery\*\*

\- In-app notifications only (V1)

\-\--

\## 12. Error & Exception Handling

\- Validation failures block progression

\- Permission errors display access denied

\- System errors logged for Admin review

\-\--

\## 13. Out-of-Scope Workflows (V1)

\- Payments

\- Course progression sync with LMS

\- External system integrations

\- Automated scoring or AI validation

\-\--

\## 14. Next Documents Dependent on This File

\- Role-Permissions-Matrix.xlsx

\- Audit-Log-Spec.md

\- API-Spec.md

\- Milestones.md

\-\--

\*\*End of Document\*\*

\# Milestones (V1)

\*\*Project:\*\* Yiba Wise -- Compliance & QCTO Oversight App

\*\*Document:\*\* Milestones.md

\*\*Version:\*\* v1.0

\*\*Date:\*\* 2026-01-14

\*\*Location:\*\* 06-Development/

\*\*Status:\*\* Draft -- Ready for team planning

\-\--

\## 1. Purpose

This document defines the milestone plan for building Version 1 of the
Compliance & QCTO Oversight App.

V1 goals:

\- Form 5 readiness digitisation

\- Evidence vault + versioning

\- LMIS core (learners + enrolments)

\- QCTO portal (view/review)

\- Full audit trail

\-\--

\## 2. Milestone Plan

\### Milestone 0 --- Project Setup & Decisions

\*\*Outcome\*\*

\- Folder structure established in Drive

\- Wireframe V1 docs locked (Overview, Screens, Fields, Workflows)

\- Data dictionary + audit spec ready

\*\*Deliverables\*\*

\- API-Spec.md

\- Milestones.md

\- Data-Dictionary.xlsx

\- Audit-Log-Spec.md

\-\--

\### Milestone 1 --- Foundation (Auth + RBAC + Skeleton UI)

\*\*Outcome\*\*

\- Users can log in

\- Roles and scopes enforced

\- App shell navigation works per role

\*\*Deliverables\*\*

\- Auth (login/reset)

\- RBAC middleware

\- Basic dashboards (empty-state)

\-\--

\### Milestone 2 --- Institution Module (Profiles + Approval)

\*\*Outcome\*\*

\- Institutions can register and be approved

\- Institution profile data captured

\*\*Deliverables\*\*

\- Institution CRUD

\- Admin approval workflow

\- Staff invite + role assignment (basic)

\-\--

\### Milestone 3 --- Form 5 Readiness Module (Core)

\*\*Outcome\*\*

\- Institutions complete readiness per qualification

\- Upload evidence per criterion

\- Submit for QCTO review

\*\*Deliverables\*\*

\- Readiness sections + status states

\- Submission workflow

\- QCTO review actions (flag/remarks/recommendation)

\-\--

\### Milestone 4 --- Evidence Vault + Versioning

\*\*Outcome\*\*

\- Structured document storage

\- Document replacement creates versions

\- QCTO can accept/flag evidence

\*\*Deliverables\*\*

\- Document categories

\- Version history UI + API

\- Evidence review workflow

\-\--

\### Milestone 5 --- LMIS Core (Learners + Enrolments)

\*\*Outcome\*\*

\- Learners created and managed

\- Enrolments tracked across institutions

\- POPIA gating enforced

\*\*Deliverables\*\*

\- Learner CRUD + search

\- Enrolment CRUD + status changes

\- Multi-institution enrolment timeline (basic)

\-\--

\### Milestone 6 --- Audit Log (End-to-End)

\*\*Outcome\*\*

\- Every change is tracked and visible per role

\- QCTO can view history and diffs

\*\*Deliverables\*\*

\- Audit events on all mutable endpoints

\- Audit viewer UI + filtering

\- Diff display (before/after)

\-\--

\### Milestone 7 --- Reports & Export (V1 Basic)

\*\*Outcome\*\*

\- QCTO and Admin can export lists and reports

\*\*Deliverables\*\*

\- Summary reports

\- CSV export endpoints

\- Basic export UI

\-\--

\### Milestone 8 --- QA, Security Pass, Pilot Readiness

\*\*Outcome\*\*

\- Stable pilot-ready release

\- Known gaps documented for V2

\*\*Deliverables\*\*

\- Test plan + test cases

\- POPIA + access control review

\- Performance baseline

\- Pilot onboarding checklist

\-\--

\## 3. Definition of Done (V1)

A feature is "done" when:

\- UI works end-to-end with API

\- Permissions enforced correctly

\- Audit logs captured for changes

\- Validation rules applied

\- Errors handled cleanly

\- Tested with sample data

\-\--

\## 4. V2 Parking Lot (Not V1)

\- Deep Tutor LMS integration

\- SMS / 2FA

\- Advanced analytics and anomaly detection

\- Automated readiness scoring

\- External integrations (SETA, QCTO internal systems)

\-\--

\*\*End of Document\*\*

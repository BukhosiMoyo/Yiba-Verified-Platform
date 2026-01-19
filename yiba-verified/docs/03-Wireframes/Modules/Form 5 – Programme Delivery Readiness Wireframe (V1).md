\# Form 5 -- Programme Delivery Readiness Wireframe (V1)

\*\*Project:\*\* Yiba Wise -- Compliance & QCTO Oversight App

\*\*Module:\*\* Programme Delivery Readiness (Form 5)

\*\*Document:\*\* Form5-Readiness-Wireframe.md

\*\*Version:\*\* v1.0

\*\*Date:\*\* 2026-01-14

\*\*Location:\*\* 03-Wireframes/Modules/

\*\*Status:\*\* Approved for UI/UX + Development

\-\--

\## 1. Purpose

This document defines the \*\*screen-level wireframe and behaviour\*\*
for the Programme Delivery Readiness (Form 5) module.

It covers:

\- Screen layout

\- Navigation

\- Section structure

\- Validation behaviour

\- Submission & review flows

\- QCTO review interaction

This module is \*\*compliance-critical\*\* and must strictly follow QCTO
expectations.

\-\--

\## 2. Entry Point & Navigation

\### 2.1 Entry Point

\- Institution Dashboard → \*\*Programme Delivery Readiness\*\*

\- Select \*\*Qualification / Curriculum\*\*

\-\--

\### 2.2 Layout Structure (All Screens)

\*\*Global Layout\*\*

┌─────────────────────────────────────────────┐\
│ Top Bar: Institution Name \| Qualification │\
├──────────────┬──────────────────────────────┤\
│ Left Nav │ Main Content Area │\
│ (Sections) │ │\
│ │ │\
└──────────────┴──────────────────────────────┘

\*\*Left Navigation (Persistent)\*\*

\- Overview

\- Qualification Information

\- Self-Assessment

\- Registration & Legal Compliance

\- Human Resources

\- Infrastructure & Resources

\- LMS & Online Capability

\- Workplace-Based Learning

\- Policies & Procedures

\- Occupational Health & Safety

\- Learning Material Alignment

\- Review & Submit

Each item displays:

\- Status badge: Not Started / In Progress / Complete / Flagged

\-\--

\## 3. Screen: Readiness Overview

\*\*Purpose\*\*

\- High-level completion status

\- Entry point into sections

\*\*Components\*\*

\- Qualification summary card

\- Completion progress bar (%)

\- Section checklist with status badges

\- "Continue" button (last incomplete section)

\*\*Rules\*\*

\- Sections incomplete → submission disabled

\- Flagged sections highlighted in red (post-review)

\-\--

\## 4. Screen: Qualification Information

\*\*Fields (Read-Only once submitted)\*\*

\- Qualification Title

\- SAQA ID

\- NQF Level

\- Credits

\- Curriculum Code

\- Delivery Mode(s)

\*\*Actions\*\*

\- Save Draft

\- Continue

\-\--

\## 5. Screen: Self-Assessment

\*\*Fields\*\*

\- Self-Assessment Completed (Yes / No)

\- Remarks / Narrative (text area)

\- Supporting Evidence (optional upload)

\*\*Rules\*\*

\- Cannot mark section complete without selection

\- Save Draft available

\-\--

\## 6. Screen: Registration & Legal Compliance

\*\*Fields\*\*

\- Registration Type

\- Registration Proof (upload)

\- Tax Compliance PIN / Exemption Proof (upload)

\- Professional Body Registration (Yes/No)

\- Supporting Evidence Upload

\*\*Validation\*\*

\- Required uploads enforced

\- File type & size validation

\- Versioning enabled

\-\--

\## 7. Screen: Human Resources (Facilitators)

\*\*Layout\*\*

\- Table of facilitators

\- "Add Facilitator" button

\*\*Per Facilitator Fields\*\*

\- Full Name

\- ID / Passport

\- Nationality

\- Role (Facilitator / Assessor / Moderator)

\- CV Upload

\- Qualification(s)

\- Industry Experience

\- Contract / SLA Upload

\- SAQA Evaluation (if applicable)

\- Work Permit (if applicable)

\*\*Rules\*\*

\- At least one facilitator required

\- Each facilitator validated independently

\-\--

\## 8. Screen: Infrastructure & Physical Resources

\*\*Fields\*\*

\- Training Site Address

\- Ownership Type

\- Proof of Ownership / Lease Upload

\- Number of Training Rooms

\- Room Capacity

\- Furniture & Equipment Checklist

\- Inventory Upload

\- Facilitator : Learner Ratio

\-\--

\## 9. Screen: LMS & Online Delivery Capability

\*\*Fields\*\*

\- LMS Name

\- LMS Licence Proof Upload

\- Max Learner Capacity

\- Internet Connectivity Method

\- ISP

\- Backup Frequency

\- Data Storage Description

\- Security Measures Description

\*\*Condition\*\*

\- Section required only if delivery mode includes Blended / Online

\-\--

\## 10. Screen: Workplace-Based Learning (WBL)

\*\*Fields\*\*

\- Workplace Partner Name

\- Agreement Type

\- Agreement Upload

\- Agreement Duration

\- WBL Components Covered

\- Learner Support Description

\- Logbook Template Upload

\- Monitoring Schedule Upload

\- Assessment Responsibility

\-\--

\## 11. Screen: Policies & Procedures

\*\*Layout\*\*

\- Policy list with status indicators

\*\*Per Policy\*\*

\- Policy Type

\- Policy Document Upload

\- Effective Date

\- Review Date

\*\*Required Policies\*\*

\- Finance

\- HR

\- Teaching & Learning

\- Assessment

\- Appeals

\- OHS

\- Refunds

\-\--

\## 12. Screen: Occupational Health & Safety (OHS)

\*\*Fields\*\*

\- Fire Extinguisher Available

\- Fire Extinguisher Service Date

\- Emergency Exits Marked

\- Evacuation Plan Upload

\- OHS Audit Report Upload

\- Accessibility for Disabilities

\- First Aid Kit Available

\- OHS Representative Name

\- OHS Appointment Letter Upload

\-\--

\## 13. Screen: Learning Material Alignment

\*\*Fields\*\*

\- Learning Material Exists (Yes/No)

\- Knowledge Module Coverage (%)

\- Practical Module Coverage (%)

\- Curriculum Alignment Confirmation

\- Sample Learning Material Upload (≥50%)

\-\--

\## 14. Screen: Review & Submit

\*\*Components\*\*

\- Section completion checklist

\- Flag summary (if resubmission)

\- Declaration checkbox

\- Submit for QCTO Review button

\*\*Rules\*\*

\- Submit disabled until all mandatory sections complete

\- Submission locks editing (except flagged sections)

\-\--

\## 15. QCTO Review Panel (Read-Only + Actions)

\*\*Visible To:\*\* QCTO users only

\*\*Features\*\*

\- Section-by-section view

\- Evidence preview

\- Audit history link

\- Action buttons:

\- Accept Evidence

\- Flag Section (remarks required)

\- Add General Remarks

\-\--

\## 16. Status Flow (Visual Badges)

\- Not Started (Grey)

\- In Progress (Blue)

\- Complete (Green)

\- Flagged (Red)

\- Under Review (Purple)

\- Recommended / Not Recommended (Final)

\-\--

\## 17. Audit & Versioning Behaviour

\- Every edit logged

\- Evidence replacements versioned

\- Submission timestamps recorded

\- QCTO actions audited

\-\--

\## 18. Error & Empty States

\- Missing evidence warning

\- Invalid file upload error

\- Permission denied

\- Section locked after submission

\-\--

\## 19. Out-of-Scope (V1)

\- Automated readiness scoring

\- AI validation

\- External QCTO system sync

\-\--

\## 20. Dependencies

\- Wireframe-V1-Forms-Fields.md

\- Wireframe-V1-Workflows.md

\- Audit-Log-Spec.md

\-\--

\*\*End of Document\*\*

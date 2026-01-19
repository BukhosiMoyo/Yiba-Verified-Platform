\# Wireframe V1 -- Forms & Fields

\*\*Project:\*\* Yiba Wise -- Compliance & QCTO Oversight App

\*\*Version:\*\* v1.0

\*\*Date:\*\* 2026-01-14

\*\*Depends on:\*\*

\- Wireframe-V1-Overview.md

\- Wireframe-V1-Screens.md

\- EISA-Fields-Mapping.xlsx

\- QCTO Form 5 -- Programme Delivery Readiness

\*\*Status:\*\* Approved for implementation reference

\-\--

\## 1. Purpose of This Document

This document defines:

\- All \*\*forms\*\* in Version 1

\- All \*\*fields per form\*\*

\- Required vs optional fields

\- Validation rules (high-level)

\- Relationships between data

This document prevents:

\- Missing compliance fields

\- Inconsistent data capture

\- Rework caused by assumptions

\-\--

\## 2. Global Field Rules (Applies to All Forms)

\- Required fields must be clearly marked

\- All dates stored in ISO format (YYYY-MM-DD)

\- All uploads must support versioning

\- All updates must trigger an audit log entry

\- POPIA consent must exist before learner data submission

\-\--

\## 3. Authentication & User Profile Forms

\### 3.1 Login Form

\*\*Fields\*\*

\- Email / Username (required)

\- Password (required)

\-\--

\### 3.2 User Profile Form

\*\*Fields\*\*

\- First Name (required)

\- Last Name (required)

\- Email (required)

\- Phone Number

\- Role (system assigned)

\- Institution (if applicable -- read-only)

\-\--

\## 4. Institution Profile Form

\### 4.1 Institution Details

\*\*Fields\*\*

\- Legal Name of Institution (required)

\- Trading Name

\- Institution Type (TVET, Private SDP, NGO, University, etc.)

\- Registration Number (CIPC / EMIS / HEMIS)

\- Tax Compliance PIN

\- Physical Address

\- Postal Address

\- Province

\- Contact Person Name

\- Contact Email

\- Contact Number

\- Delivery Mode(s)

\- Face-to-Face

\- Blended / Hybrid

\- Mobile Unit

\-\--

\## 5. Programme Delivery Readiness (Form 5)

\### 5.1 Qualification Information

\*\*Fields\*\*

\- Qualification / Curriculum Title (required)

\- SAQA ID (required)

\- NQF Level

\- Credits

\- Curriculum Code

\-\--

\### 5.2 Self-Assessment

\*\*Fields\*\*

\- Self-Assessment Completed (Yes/No)

\- Remarks / Evidence Narrative

\-\--

\### 5.3 Registration & Legal Compliance

\*\*Fields\*\*

\- Institution Registration Type

\- Registration Proof (Upload)

\- Tax Compliance PIN / Exemption Proof (Upload)

\- Professional Body Registration (Yes/No)

\- Supporting Evidence Upload

\-\--

\### 5.4 Human Resources (Facilitators)

\*\*Fields (per facilitator)\*\*

\- Full Name

\- ID Number / Passport

\- Nationality

\- CV Upload

\- Qualification(s)

\- Industry Experience Description

\- Employment Contract / SLA Upload

\- Role (Facilitator / Assessor / Moderator)

\- SAQA Evaluation (Non-SA qualifications -- Upload)

\- Work Permit / Visa (if applicable)

\-\--

\### 5.5 Infrastructure & Physical Resources

\*\*Fields\*\*

\- Training Site Address

\- Ownership Type (Owned / Leased)

\- Proof of Ownership / Lease Agreement (Upload)

\- Number of Training Rooms

\- Room Capacity

\- Furniture & Equipment Checklist

\- Inventory List Upload

\- Facilitator : Learner Ratio

\-\--

\### 5.6 LMS & Online Delivery Capability (Blended / Online)

\*\*Fields\*\*

\- LMS Name

\- LMS License Proof (Upload)

\- Maximum Learner Capacity

\- Internet Connectivity Method

\- Internet Service Provider

\- Backup Frequency

\- Data Storage Description

\- Security Measures Description

\-\--

\### 5.7 Workplace-Based Learning (WBL)

\*\*Fields\*\*

\- Workplace Partner Name

\- Agreement Type (MOU / SLA)

\- Agreement Upload

\- Duration of Agreement

\- WBL Components Covered

\- Learner Support Description

\- Logbook Template Upload

\- Monitoring Schedule Upload

\- Assessment Responsibility

\-\--

\### 5.8 Policies & Procedures

\*\*Fields (per policy)\*\*

\- Policy Type (Finance, HR, Teaching & Learning, Assessment, Appeals,
OHS, Refund)

\- Policy Document Upload

\- Effective Date

\- Review Date

\-\--

\### 5.9 Occupational Health & Safety (OHS)

\*\*Fields\*\*

\- Fire Extinguisher Available (Yes/No)

\- Fire Extinguisher Service Date

\- Emergency Exits Marked (Yes/No)

\- Evacuation Plan Upload

\- OHS Audit Report Upload

\- Accessibility for Disabilities (Yes/No)

\- First Aid Kit Available (Yes/No)

\- OHS Representative Name

\- OHS Appointment Letter Upload

\-\--

\### 5.10 Learning Material Alignment

\*\*Fields\*\*

\- Learning Material Exists (Yes/No)

\- Knowledge Module Coverage (%)

\- Practical Module Coverage (%)

\- Curriculum Alignment Confirmation

\- Sample Learning Material Upload (≥50%)

\-\--

\### 5.11 Readiness Submission

\*\*Fields\*\*

\- Submission Declaration (Checkbox)

\- Submit for QCTO Review (Action)

\- Submission Date (system-generated)

\-\--

\## 6. Learner Management Information System (LMIS)

\### 6.1 Learner Profile (EISA-Aligned)

\*\*Identity\*\*

\- SDP Code

\- Qualification ID

\- National ID (required)

\- Learner Alternate ID

\- Alternate ID Type

\- First Name

\- Middle Name

\- Last Name

\- Title

\- Birth Date

\*\*Demographics\*\*

\- Gender Code

\- Nationality Code

\- Home Language Code

\- Citizen / Resident Status

\- Equity Code

\- Disability Status

\- Disability Rating

\- Socio-Economic Status

\- Immigrant Status

\*\*Contact Details\*\*

\- Home Address

\- Postal Address

\- Postal Code

\- Province Code

\- Phone Number

\- Email Address

\*\*POPIA\*\*

\- POPIA Consent (Yes/No)

\- Consent Date

\-\--

\### 6.2 Enrolment Form

\*\*Fields\*\*

\- Institution

\- Qualification

\- Enrolment Start Date

\- Expected Completion Date

\- Delivery Mode

\- Enrolment Status (Active / Completed / Transferred)

\-\--

\### 6.3 Attendance & Readiness

\*\*Fields\*\*

\- Attendance Records

\- Assessment Centre Code

\- Learner Readiness for EISA Type

\- FLC Status

\- FLC Statement Number

\- Statement of Results Status

\- Statement Issue Date

\-\--

\## 7. Evidence & Document Upload Rules

\*\*Common Fields\*\*

\- Document Type

\- Related Entity (Institution / Learner / Qualification)

\- Upload File

\- Version Number (system-generated)

\- Upload Date

\- Uploaded By

\-\--

\## 8. Audit Log (System Generated)

\*\*Fields\*\*

\- Entity Type

\- Record ID

\- Field Changed

\- Old Value

\- New Value

\- Changed By

\- Role

\- Date & Time

\- Reason for Change (optional / required if flagged)

\-\--

\## 9. Validation Rules (High-Level)

\- Learner cannot be submitted without POPIA consent

\- Readiness cannot be submitted without mandatory evidence

\- QCTO users cannot edit institution data

\- Replaced documents retain previous versions

\- All edits generate audit entries

\-\--

\## 10. Out-of-Scope (V1)

\- Course content fields

\- Assessment scoring logic

\- Payments or billing fields

\- Public registration forms

\-\--

\## 11. Next Documents Dependent on This File

\- Wireframe-V1-Workflows.md

\- Role-Permissions-Matrix.xlsx

\- Audit-Log-Spec.md

\- Data-Dictionary.xlsx

\-\--

\*\*End of Document\*\*

# Data Dictionary (V1)

Project: **Yiba Wise – Compliance & QCTO Oversight App**  
Version: **v1.0**  
Date: **2026-01-14**  
Canonical location (recommended): `04-Data/Data-Dictionary.md`  
Reference spreadsheet: `04-Data/Data-Dictionary_REFERENCE.xlsx`

> **Rule:** This Markdown file is the **source of truth for Cursor**. The `.xlsx` is **reference-only**.

---

## 1) Institution

| Field Name | Data Type | Required | Description | Source |
|---|---|---:|---|---|
| institution_id | UUID | Yes | Unique system identifier | System |
| legal_name | Text | Yes | Legal name of institution | Institution |
| trading_name | Text | No | Trading name | Institution |
| institution_type | Enum | Yes | TVET, Private SDP, NGO, University | QCTO |
| registration_number | Text | Yes | CIPC / EMIS / HEMIS number | Institution |
| tax_compliance_pin | Text | No | SARS Tax PIN or exemption | Institution |
| physical_address | Text | Yes | Physical training site address | Institution |
| postal_address | Text | No | Postal address | Institution |
| province | Enum | Yes | Province code | System |
| delivery_modes | Enum[] | Yes | Face-to-Face / Blended / Mobile | QCTO |
| status | Enum | Yes | Draft / Approved / Suspended | System |
| created_at | DateTime | Yes | Record creation timestamp | System |

---

## 2) User

| Field Name | Data Type | Required | Description | Source |
|---|---|---:|---|---|
| user_id | UUID | Yes | Unique user identifier | System |
| institution_id | UUID | No | Linked institution (if applicable) | System |
| role | Enum | Yes | Admin / QCTO / Institution / Student | System |
| first_name | Text | Yes | User first name | User |
| last_name | Text | Yes | User surname | User |
| email | Email | Yes | Login email | User |
| phone | Text | No | Contact number | User |
| status | Enum | Yes | Active / Inactive | System |
| created_at | DateTime | Yes | Account creation date | System |

---

## 3) Readiness

| Field Name | Data Type | Required | Description | Source |
|---|---|---:|---|---|
| readiness_id | UUID | Yes | Readiness record ID | System |
| institution_id | UUID | Yes | Linked institution | System |
| qualification_title | Text | Yes | Qualification name | QCTO |
| saqa_id | Text | Yes | SAQA ID | QCTO |
| nqf_level | Integer | No | NQF level | QCTO |
| curriculum_code | Text | Yes | Curriculum code | QCTO |
| delivery_mode | Enum | Yes | Face-to-Face / Blended / Mobile | QCTO |
| readiness_status | Enum | Yes | Not Started / In Progress / Submitted / Reviewed | System |
| submission_date | Date | No | Date submitted to QCTO | System |

---

## 4) Learner

| Field Name | Data Type | Required | Description | Source |
|---|---|---:|---|---|
| learner_id | UUID | Yes | System learner ID | System |
| national_id | Text | Yes | SA ID / Passport | Learner |
| alternate_id | Text | No | Alternative learner ID | Institution |
| first_name | Text | Yes | Learner first name | Learner |
| last_name | Text | Yes | Learner surname | Learner |
| birth_date | Date | Yes | Date of birth | Learner |
| gender_code | Enum | Yes | Gender code | EISA |
| nationality_code | Enum | Yes | Nationality code | EISA |
| home_language_code | Enum | No | Home language | EISA |
| disability_status | Enum | No | Disability status | EISA |
| popia_consent | Boolean | Yes | POPIA consent indicator | System |
| consent_date | Date | Yes | Date of consent | System |

---

## 5) Enrolment

| Field Name | Data Type | Required | Description | Source |
|---|---|---:|---|---|
| enrolment_id | UUID | Yes | Enrolment record ID | System |
| learner_id | UUID | Yes | Linked learner | System |
| institution_id | UUID | Yes | Linked institution | System |
| qualification_title | Text | Yes | Qualification name | Institution |
| start_date | Date | Yes | Enrolment start date | Institution |
| expected_completion_date | Date | No | Expected completion | Institution |
| enrolment_status | Enum | Yes | Active / Completed / Transferred | System |

---

## 6) Attendance & Readiness (EISA)

| Field Name | Data Type | Required | Description | Source |
|---|---|---:|---|---|
| attendance_id | UUID | Yes | Attendance record ID | System |
| enrolment_id | UUID | Yes | Linked enrolment | System |
| attendance_percentage | Decimal | No | Attendance percentage | Institution |
| assessment_centre_code | Text | No | Assessment centre code | QCTO |
| readiness_status | Enum | Yes | Not Ready / Ready / Submitted | System |
| flc_status | Enum | No | FLC status | QCTO |
| statement_number | Text | No | Statement number | QCTO |

---

## 7) Evidence & Documents

| Field Name | Data Type | Required | Description | Source |
|---|---|---:|---|---|
| document_id | UUID | Yes | Document record ID | System |
| related_entity | Enum | Yes | Institution / Learner / Readiness | System |
| related_entity_id | UUID | Yes | Linked record ID | System |
| document_type | Enum | Yes | CV, Policy, MOU, OHS, etc. | QCTO |
| file_name | Text | Yes | Original file name | System |
| version | Integer | Yes | Document version number | System |
| uploaded_by | UUID | Yes | User who uploaded | System |
| uploaded_at | DateTime | Yes | Upload timestamp | System |

---

## 8) Audit Log

| Field Name | Data Type | Required | Description | Source |
|---|---|---:|---|---|
| audit_id | UUID | Yes | Audit record ID | System |
| entity_type | Enum | Yes | Learner / Enrolment / Readiness | System |
| entity_id | UUID | Yes | Linked entity ID | System |
| field_name | Text | Yes | Field changed | System |
| old_value | Text | No | Previous value | System |
| new_value | Text | No | Updated value | System |
| changed_by | UUID | Yes | User ID | System |
| role_at_time | Enum | Yes | Role during change | System |
| changed_at | DateTime | Yes | Timestamp | System |
| reason | Text | No | Reason for change | User |

---

## Notes for Engineering (V1)
- Prefer `UUID` everywhere for IDs.
- All tables should include `created_at` and `updated_at` even if not listed above (auditability + ops).
- Consider `deleted_at` (soft delete) for **non-audit** entities. Audit log and evidence versions should be immutable (no deletes).
- Keep enum naming consistent across API, DB, and UI (single canonical enum definitions).

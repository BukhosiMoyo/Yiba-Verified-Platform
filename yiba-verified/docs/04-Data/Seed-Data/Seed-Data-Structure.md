# Seed Data Structure (V1)
Project: Yiba Wise – Compliance & QCTO Oversight App
Document: Seed-Data-Structure.md
Version: v1.0
Date: 2026-01-14
Location: 04-Data/Seed-Data/

---

## Purpose
Defines how sample data is translated into database seed data for development, testing, and demo environments.

This document ensures:
- Predictable environments
- Consistent demos
- Fast onboarding for developers

---

## Seeding Order (Important)
Seed data must be inserted in the following order to maintain referential integrity:

1. Roles
2. Users
3. Institutions
4. Qualifications
5. Institution-Qualification Links
6. Learners
7. Enrolments
8. Readiness Records (Form 5)
9. Evidence Documents
10. Audit Logs

---

## Roles
Table: roles

| Field | Example |
|-----|--------|
| id | ROLE_QCTO |
| name | QCTO Reviewer |
| scope | global |
| permissions | read, review |

---

## Users
Table: users

| Field | Example |
|-----|--------|
| id | USR_001 |
| email | reviewer@qcto.org.za |
| role_id | ROLE_QCTO |
| institution_id | null |
| status | active |

---

## Institutions
Table: institutions

| Field | Example |
|-----|--------|
| id | INST-001 |
| name | Ubuntu Skills Development Centre |
| province | Gauteng |
| status | approved |

---

## Qualifications
Table: qualifications

| Field | Example |
|-----|--------|
| saqa_id | 101869 |
| title | Occupational Certificate: Project Manager |
| nqf_level | 6 |
| credits | 240 |

---

## Institution Qualifications
Table: institution_qualifications

| Field | Example |
|-----|--------|
| id | IQ-001 |
| institution_id | INST-001 |
| qualification_id | 101869 |
| delivery_mode | blended |

---

## Learners
Table: learners

| Field | Example |
|-----|--------|
| id | LRN-001 |
| national_id | 9001015009087 |
| first_name | Thabo |
| last_name | Mokoena |
| popia_consent | true |

---

## Enrolments
Table: enrolments

| Field | Example |
|-----|--------|
| id | ENR-001 |
| learner_id | LRN-001 |
| institution_qualification_id | IQ-001 |
| start_date | 2025-02-01 |
| status | active |

---

## Readiness (Form 5)
Table: readiness

| Field | Example |
|-----|--------|
| id | RDY-001 |
| institution_qualification_id | IQ-001 |
| status | under_review |
| completion_percentage | 91 |

---

## Evidence Documents
Table: documents

| Field | Example |
|-----|--------|
| id | DOC-001 |
| readiness_id | RDY-001 |
| type | facilitator_cv |
| version | 1 |
| status | accepted |

---

## Audit Logs
Table: audit_logs

| Field | Example |
|-----|--------|
| id | AUD-001 |
| entity | readiness |
| entity_id | RDY-001 |
| action | update |
| old_value | 40% |
| new_value | 60% |
| user_id | USR_010 |

---

## Environment Usage
- Development: Full seed
- QA: Full seed + edge cases
- Demo: Clean seed with stable IDs
- Production: No seed data

---

## Rules
- IDs must remain stable
- Seed data must be idempotent
- Never seed real personal data

---

End of Document

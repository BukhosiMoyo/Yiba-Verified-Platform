API Specification (V1)

\*\*Project:\*\* Yiba Wise -- Compliance & QCTO Oversight App

\*\*Document:\*\* API-Spec.md

\*\*Version:\*\* v1.0

\*\*Date:\*\* 2026-01-14

\*\*Location:\*\* 06-Development/

\*\*Status:\*\* Draft -- Ready for implementation planning

\-\--

\## 1. Purpose

This API spec defines the \*\*Version 1\*\* backend endpoints for the
Compliance & QCTO Oversight App.

Goals:

\- Clear separation of concerns (Auth, Institutions, Readiness, LMIS,
Evidence, Audit)

\- Role-based access control (RBAC) and scope control

\- Audit logging for all mutable actions

\- Predictable response format for frontend integration

\-\--

\## 2. API Conventions

\### 2.1 Base URL

\- \`/api/v1\`

\### 2.2 Auth

\- JWT access token (Bearer)

\- Optional refresh token (recommended)

\### 2.3 Common Response Format

Success:

\`\`\`json

{

\"success\": true,

\"data\": {},

\"meta\": {}

}

Error:

{

\"success\": false,

\"error\": {

\"code\": \"VALIDATION_ERROR\",

\"message\": \"Human readable message\",

\"details\": \[\]

}

}

### **2.4 Pagination** {#pagination}

Query:

- page (default 1)

- pageSize (default 20)

- sort (e.g. created_at:desc)

Response meta:

\"meta\": { \"page\": 1, \"pageSize\": 20, \"total\": 120 }

## **3. RBAC & Scope Rules (High Level)** {#rbac-scope-rules-high-level}

- **Platform Admin:** full access

- **QCTO:** read-only across all data; write only on review actions
  > (remarks/flags/recommendations)

- **Institution Admin:** full access within their institution scope

- **Institution Staff:** limited write within institution scope
  > (assigned modules)

- **Student:** read-only self profile + enrolment history + certificates

All write actions must:

- validate permissions

- log audit entries

- be transactional (fail if audit write fails)

## **4. Authentication Endpoints** {#authentication-endpoints}

### **POST /auth/login**

Request:

- email

- password

Response:

- accessToken

- refreshToken (optional)

- user

### **POST /auth/logout**

Invalidates refresh token (if used)

### **POST /auth/forgot-password**

Request:

- email

### **POST /auth/reset-password**

Request:

- token

- newPassword

### **GET /auth/me**

Returns current user profile + role + scope

## **5. Users & Roles (Admin + Institution Admin)** {#users-roles-admin-institution-admin}

### **GET /users**

Filters:

- role

- institution_id

- status

### **POST /users**

Create user (Admin only)

### **PATCH /users/{user_id}**

Edit user fields (Admin / Institution Admin within scope)

### **PATCH /users/{user_id}/status**

Activate/Deactivate user

### **GET /roles**

List roles + permissions (read-only)

## **6. Institution Endpoints** {#institution-endpoints}

### **GET /institutions**

Access:

- Admin: all

- QCTO: all

- Institution: own only

Filters:

- province

- status

- delivery_mode

### **POST /institutions**

Admin create (optional; otherwise signup flow)

### **GET /institutions/{institution_id}**

### **PATCH /institutions/{institution_id}**

Institution Admin edits own; Admin edits all

### **PATCH /institutions/{institution_id}/status**

Approve / Reject / Suspend (Admin only)  
Request:

- status

- remarks (required for reject/suspend)

## **7. Programme Delivery Readiness (Form 5)** {#programme-delivery-readiness-form-5}

### **GET /readiness**

Filters:

- institution_id

- status

- qualification_title

- saqa_id

- delivery_mode

### **POST /readiness**

Create readiness record for qualification (Institution Admin)

### **GET /readiness/{readiness_id}**

### **PATCH /readiness/{readiness_id}**

Update readiness fields (Institution scope)

### **POST /readiness/{readiness_id}/submit**

Moves status -\> Ready for Review / Submitted  
Validations:

- required evidence present

- required sections complete

### **POST /readiness/{readiness_id}/review**

(QCTO only)  
Request:

- action: FLAG \| REMARK \| RECOMMEND \| NOT_RECOMMEND

- message (required)

- section (optional)

- evidence_id (optional)

## **8. Evidence & Document Vault** {#evidence-document-vault}

### **POST /documents**

Upload document  
Request:

- related_entity (Institution/Learner/Readiness)

- related_entity_id

- document_type

- file

### **GET /documents**

Filters:

- related_entity

- related_entity_id

- document_type

- status (uploaded/flagged/accepted)

### **GET /documents/{document_id}**

### **POST /documents/{document_id}/replace**

Upload a new version  
Response includes new version

### **POST /documents/{document_id}/review**

(QCTO only)  
Request:

- status: ACCEPTED \| FLAGGED

- remarks (required for flagged)

## **9. Learner Management (LMIS)** {#learner-management-lmis}

### **GET /learners**

Filters:

- institution_id (Admin/QCTO can specify; institution forced to own)

- national_id

- name

- status

- qualification

- year

### **POST /learners**

Create learner (Institution scope)  
Validations:

- national_id required and unique (global)

- POPIA fields required before submission workflows

### **GET /learners/{learner_id}**

### **PATCH /learners/{learner_id}**

Edit (Institution scope)

### **PATCH /learners/{learner_id}/archive**

Archive (Institution Admin / Admin)

## **10. Enrolments** {#enrolments}

### **GET /enrolments**

Filters:

- learner_id

- institution_id

- status

- qualification_title

### **POST /enrolments**

Create enrolment (Institution scope)  
Validations:

- learner exists

- institution scope enforced

### **PATCH /enrolments/{enrolment_id}**

Update enrolment (Institution scope)

### **PATCH /enrolments/{enrolment_id}/status**

Status change:

- ACTIVE/COMPLETED/TRANSFERRED/WITHDRAWN

## **11. Attendance & Readiness (EISA)** {#attendance-readiness-eisa}

### **GET /attendance**

Filters:

- enrolment_id

- learner_id

- date range

### **POST /attendance**

Create/update attendance entry (Institution scope)

### **GET /eisa-readiness**

Filters:

- institution_id

- learner_id

- status

### **POST /eisa-readiness**

Create/update readiness record (Institution scope)

### **POST /eisa-readiness/{id}/submit**

Mark as submitted (Institution Admin)

## **12. Audit Log** {#audit-log}

### **GET /audit**

Access:

- Admin: all

- QCTO: all

- Institution: own scope  
  > Filters:

- entity_type

- entity_id

- user_id

- date range

### **GET /audit/{audit_id}**

Returns full before/after diff record

## **13. Reports & Exports (V1)** {#reports-exports-v1}

### **GET /reports/summary**

Role-based summary counts

### **POST /exports**

Create export job (sync in V1)  
Request:

- type: institutions \| readiness \| learners \| enrolments \| audit

- filters

Response:

- file URL or export ID

## **14. Non-Functional Requirements (V1)** {#non-functional-requirements-v1}

- Audit write must be part of the same transaction as data write

- Rate limiting for auth endpoints

- File upload size limits and allowed file types

- Logging & monitoring baseline

\# Audit Log Specification  
\*\*Project:\*\* Yiba Wise – Compliance & QCTO Oversight App    
\*\*Document:\*\* Audit-Log-Spec.md    
\*\*Version:\*\* v1.0    
\*\*Date:\*\* 2026-01-14    
\*\*Location:\*\* 04-Data/    
\*\*Status:\*\* Approved – Implementation Required

\---

\#\# 1\. Purpose of This Document

This document defines the \*\*audit logging framework\*\* for the Yiba Wise Compliance & QCTO Oversight App.

The audit log ensures:  
\- Data integrity  
\- Accountability  
\- Traceability of all changes  
\- Protection against unauthorised or fraudulent data manipulation  
\- Compliance with POPIA and regulator expectations

The audit log is \*\*non-optional\*\* and applies to all core data entities.

\---

\#\# 2\. Core Principles

\- Audit records are \*\*immutable\*\*  
\- Audit records are \*\*never deleted\*\*  
\- Every meaningful data change must be auditable  
\- Audit data is \*\*read-only\*\* to all users  
\- Visibility is \*\*role-based\*\*  
\- Historical values must remain accessible

\---

\#\# 3\. Entities Covered by Audit Logging

Audit logs must be generated for changes to the following entities:

\#\#\# 3.1 Institution  
\- Institution profile details  
\- Accreditation status  
\- Delivery modes  
\- Contact details

\#\#\# 3.2 Users & Roles  
\- User creation  
\- Role assignment  
\- Role changes  
\- User deactivation/reactivation

\#\#\# 3.3 Programme Delivery Readiness (Form 5\)  
\- Section status changes  
\- Field value changes  
\- Evidence acceptance / flagging  
\- Submission status changes  
\- QCTO recommendations

\#\#\# 3.4 Learner (LMIS)  
\- Learner personal data  
\- Demographics  
\- Contact information  
\- POPIA consent status

\#\#\# 3.5 Enrolments  
\- Enrolment creation  
\- Status changes (Active, Completed, Transferred, Withdrawn)  
\- Institution changes

\#\#\# 3.6 Attendance & Readiness (EISA)  
\- Attendance updates  
\- Readiness indicators  
\- Statement of results data

\#\#\# 3.7 Evidence & Documents  
\- Uploads  
\- Replacements  
\- Version changes  
\- Acceptance or flagging

\---

\#\# 4\. Audit Log Trigger Events

An audit entry must be created when:

\- A field value is created, updated, or cleared  
\- A document is uploaded or replaced  
\- A status or workflow state changes  
\- A user or role is created, modified, or removed  
\- A submission is made to QCTO  
\- A QCTO review action is recorded

Read-only actions \*\*do not\*\* generate audit entries.

\---

\#\# 5\. Audit Log Data Model

Each audit entry must contain the following fields:

\#\#\# 5.1 Required Fields  
\- Audit ID (system-generated)  
\- Entity Type (Institution, Learner, Enrolment, Evidence, etc.)  
\- Entity Record ID  
\- Field Name (or Action Type)  
\- Old Value  
\- New Value  
\- Changed By (User ID)  
\- User Role at Time of Change  
\- Institution ID (if applicable)  
\- Timestamp (UTC)  
\- Change Type (Create / Update / Delete / Status Change)

\#\#\# 5.2 Optional / Conditional Fields  
\- Reason for Change (mandatory if record is flagged or overridden)  
\- IP Address / Device Fingerprint (optional – V1)  
\- Related Submission ID (if applicable)

\---

\#\# 6\. Value Storage Rules

\- Old Value and New Value must be stored \*\*exactly as submitted\*\*  
\- Null values must be explicitly recorded as \`NULL\`  
\- File replacements must reference:  
  \- Previous version ID  
  \- New version ID

\---

\#\# 7\. Document Versioning & Audit

\#\#\# 7.1 Version Rules  
\- Every document upload starts at Version 1  
\- Each replacement increments the version number  
\- Previous versions remain accessible (read-only)

\#\#\# 7.2 Audit Entries for Documents  
Each document action must log:  
\- Document Type  
\- Version Number  
\- Uploaded By  
\- Upload Date  
\- Replacement Reference (if applicable)

\---

\#\# 8\. Audit Visibility & Access Control

\#\#\# 8.1 Access by Role

| Role               | Access Level        |  
|--------------------|-------------------|  
| Platform Admin     | Full audit access |  
| QCTO User          | Read-only (all)   |  
| Institution Admin  | Own records only  |  
| Institution Staff  | Own actions only  |  
| Student            | No audit access   |

\#\#\# 8.2 Audit UI Behaviour  
\- Audit logs are searchable and filterable  
\- Audit entries are expandable to show details  
\- No inline editing permitted

\---

\#\# 9\. Immutability & Protection Rules

\- Audit records cannot be edited or deleted by any role  
\- Database-level protections must enforce immutability  
\- Any system failure during audit write must block the original action  
\- Audit writes must be transactional with the main data change

\---

\#\# 10\. Retention Policy

\- Audit logs must be retained for \*\*minimum 7 years\*\*  
\- Longer retention applies if required by regulator  
\- Archived audit data must remain retrievable

\---

\#\# 11\. POPIA Considerations

\- Audit logs may contain personal data  
\- Access is restricted strictly by role  
\- No audit data exposed to unauthorised users  
\- Audit logs used strictly for compliance, governance, and security

\---

\#\# 12\. Audit Review Scenarios (QCTO Use)

QCTO users must be able to:  
\- View all changes to a learner record over time  
\- See before/after values  
\- Identify who made a change and when  
\- Review evidence replacement history  
\- Detect unusual or repeated changes

\---

\#\# 13\. Out-of-Scope (V1)

\- Automated anomaly detection  
\- AI-based fraud scoring  
\- External audit system integration

\---

\#\# 14\. Dependencies

This specification depends on:  
\- Wireframe-V1-Workflows.md  
\- Wireframe-V1-Forms-Fields.md  
\- Role-Permissions-Matrix.xlsx

\---

\#\# 15\. Version Control

\- v1.0 – Initial audit specification  
\- Any changes require:  
  \- Version bump  
  \- Change summary  
  \- Approval

\---

\*\*End of Document\*\*


# QCTO-Facing System Overview (Internal Prepared Document)

> Prepared for future stakeholder engagement.  
> Not a pitch — a system and process overview.

## 1. Purpose
Yiba Verified is a compliance-grade platform designed to support:
- Programme delivery readiness capture (Form 5-aligned workflow)
- Evidence collection and controlled versioning (Evidence Vault)
- Learner administration records (LMIS-style tracking)
- Regulator oversight review with audit traceability

The platform reduces paper-based submissions while strengthening integrity and transparency.

## 2. Separation from Learning Delivery (LMS)
Learning delivery remains in the existing Tutor LMS website (Yiba Wise):
- course content delivery
- learning activities and assessments

Yiba Verified focuses on:
- readiness workflows
- compliance evidence management
- learner record administration
- oversight review and auditability

This separation preserves clarity and reduces risk.

## 3. Role-Based Access and Oversight
The platform uses strict RBAC with deny-by-default access.

### QCTO User
- Read-only access across institutions
- Can review, flag, and comment on readiness items
- Can record review outcomes/recommendations
- Cannot modify institution-submitted data

### Institution Users
- Maintain institutional profile and readiness evidence
- Manage learner records and attendance
- Submit readiness packs for review
- Respond to review comments and correction requests

### Platform Admin
- Platform governance and security monitoring
- Institution lifecycle actions (approve/suspend)
- Audit access and operational oversight
- No silent editing of compliance submissions

## 4. Evidence Integrity and Versioning
Evidence is stored with:
- metadata tagging (document type, entity linkage)
- uploader identity and timestamps
- versioning (replace = new version)
- no hard deletion

This ensures evidence history remains intact.

## 5. Audit Logging and Change Traceability
All meaningful changes are recorded in an immutable audit log:
- entity + field changed
- before/after values
- who changed it (user + role)
- timestamp
- optional reason for change

Audit logs are searchable and exportable for investigations.

## 6. Review Workflow
Controlled workflow states:
- Draft → Submitted → Under Review → Returned for Correction / Reviewed → Outcome

Reviewer capabilities:
- item-level flags and notes
- correction requests
- final recommendation/outcome recording

## 7. Data Protection
The platform is designed to align with POPIA principles:
- least-privilege access
- institution scoping
- consent tracking where applicable
- retention and archiving policies

## 8. Future Enhancements (Non-binding)
Possible expansions include:
- analytics dashboards for oversight
- ticketing/helpdesk and secure messaging
- optional payment/invoicing modules (separate from compliance)
- approved integrations with external systems

---

End of document.
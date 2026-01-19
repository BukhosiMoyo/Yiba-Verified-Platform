# Change Management Policy (V1)
Project: Yiba Wise – Compliance & QCTO Oversight App
Document: Change-Management-Policy.md
Version: v1.0
Date: 2026-01-14
Location: Governance / Operations

---

## 1. Purpose
This policy defines how changes to data, documents, and system records are managed to ensure transparency, accountability, and regulatory compliance.

It exists to:
- Prevent unauthorised changes
- Maintain historical accuracy
- Support audits and dispute resolution
- Protect system integrity

---

## 2. Scope
This policy applies to:
- Institutions
- Learners
- Qualifications
- Programme Delivery Readiness (Form 5)
- Evidence documents
- User roles and permissions

---

## 3. Change Principles
- No silent changes
- No destructive edits
- Every change is traceable
- Historical records are preserved

---

## 4. Change Types

### 4.1 Data Updates
Examples:
- Learner details update
- Attendance corrections
- Readiness percentage adjustments

Rules:
- Old values are preserved
- Reason for change may be required
- Audit entry is mandatory

---

### 4.2 Document Changes
Examples:
- Evidence replacement
- Policy updates
- Revised learning materials

Rules:
- Documents are versioned
- Previous versions remain accessible
- Deletions are not permitted

---

### 4.3 Status Changes
Examples:
- Draft → Submitted
- Submitted → Flagged
- Flagged → Resubmitted
- Reviewed → Recommended / Not Recommended

Rules:
- Status transitions are logged
- QCTO remarks required for negative outcomes

---

## 5. Roles & Authority

### Institution Users
- May update data within their scope
- May not alter audit logs
- May respond to QCTO flags

### QCTO Users
- May review and flag submissions
- May not edit institution data
- Must provide remarks for flags

### System Administrators
- Configure system behaviour
- Cannot modify historical data
- All admin actions are audited

---

## 6. Audit Logging
All changes generate immutable audit records capturing:
- Entity type
- Record ID
- Field changed
- Old value
- New value
- Changed by
- Role at time of change
- Timestamp
- Reason (if applicable)

Audit logs are read-only.

---

## 7. Change Review & Disputes
- Institutions may view all changes related to their data
- QCTO may reference audit history during reviews
- System data is the final source of truth

---

## 8. Enforcement
- Changes bypassing this policy are blocked
- System failures during logging cancel the transaction
- Policy violations are reported to administrators

---

## 9. Policy Updates
- This policy is versioned
- Updates do not apply retroactively
- Historical compliance remains intact

---

End of Document

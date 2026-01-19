# Platform Admin Dashboard Wireframe (V1)
Project: Yiba Verified – Compliance & Oversight Platform
Module: Platform Admin / Operations Dashboard
Version: v1.0
Date: 2026-01-14
Location: 03-Wireframes/Modules/

---

## 1. Purpose
The Platform Admin Dashboard provides Yiba Verified operators with full system visibility for monitoring usage, security, performance, and compliance operations without interfering with regulatory workflows.

This dashboard is strictly operational and observational, not a compliance editing tool.

---

## 2. Admin Role Definition
Role: PLATFORM_ADMIN

Capabilities:
- Global read access across all entities
- User and institution management
- Security and system monitoring
- Configuration and support operations

Restrictions:
- No direct editing of readiness answers
- No deletion of evidence or audit logs
- All admin actions are audited

---

## 3. Layout Overview
- Top Bar: Platform Name | Environment | Admin User
- Left Navigation:
  - Overview
  - Institutions
  - Users & Sessions
  - QCTO Activity
  - Evidence & Storage
  - Security & Audit
  - System Health
  - Settings (restricted)

Main content uses dashboard cards, tables, and charts.

---

## 4. Overview Screen
Widgets:
- Users Online Now
- Logins Today (by role)
- Active Institutions
- Submissions Awaiting Review
- Flags Raised (24h)
- System Status (OK / Degraded)

---

## 5. Institutions Panel
Table:
- Institution Name
- Status (Approved / Pending / Suspended)
- Active Qualifications
- Readiness Status
- Last Activity
- Flags Count

Actions:
- View Institution (read-only)
- Suspend / Reactivate (status only)
- View Activity Timeline

---

## 6. Users & Sessions
Widgets:
- Active Sessions
- Failed Login Attempts
- MFA Enabled %

Table:
- User Name
- Role
- Institution (if applicable)
- Last Login
- Session Status

Actions:
- Force Logout
- Reset MFA / Password (logged)

---

## 7. QCTO Activity Monitoring
Widgets:
- Active QCTO Reviewers
- Reviews Completed (7 days)
- Avg Review Turnaround

Table:
- Reviewer Name
- Last Login
- Reviews Completed
- Flags Raised

---

## 8. Evidence & Storage
Widgets:
- Total Documents
- Flagged Documents
- Storage Used (GB)

Table:
- Document Type
- Count
- Avg Size
- Flag Rate

---

## 9. Security & Audit
Widgets:
- Audit Events Today
- High-Risk Events
- Repeated Failed Logins

Table:
- Event Type
- Entity
- User
- Timestamp
- Risk Level

Actions:
- View Audit Log (read-only)
- Export Logs (restricted)

---

## 10. System Health
Widgets:
- API Uptime
- Error Rate
- Queue Backlog
- Background Jobs Status

---

## 11. Settings (Restricted)
- Feature Toggles
- Notification Thresholds
- Maintenance Mode

Access limited to Super Admin only.

---

## 12. Audit & Logging
All admin actions generate audit entries including:
- Admin user
- Action type
- Target entity
- Timestamp
- Reason (mandatory for sensitive actions)

---

## 13. Notes
- Admin dashboard is not visible to QCTO or Institutions
- All data is real-time or near real-time
- No bulk destructive actions permitted

---

End of Document

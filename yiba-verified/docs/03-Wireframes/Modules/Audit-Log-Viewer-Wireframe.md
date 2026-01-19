# Audit Log Viewer Wireframe (V1)
Project: Yiba Wise – Compliance & QCTO Oversight App
Module: Audit Log Viewer
Version: v1.0
Date: 2026-01-14

---

## Purpose
Provides transparent, read-only access to all system changes for compliance, investigation, and oversight.

---

## Layout
- Filters Panel (Entity, User, Date Range)
- Audit Log Table
- Change Detail Drawer

---

## Features
- View Audit Entries
- Filter & Search Logs
- Expand Entry for Before/After Comparison

---

## Audit Entry Details
- Entity Type
- Record ID
- Field Changed
- Old Value
- New Value
- Changed By
- Role at Time
- Timestamp
- Reason (if provided)

---

## Access Rules
- Admin: full access
- QCTO: read-only (all)
- Institution: own scope only
- Students: no access

---

## Rules
- Immutable records
- No edits or deletions
- Export permitted (Admin/QCTO)

---

End of Document

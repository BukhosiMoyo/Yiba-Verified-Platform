# Notifications Audit

Internal checklist for notification events: origin, recipients, delivery, priority, link target, and implementation status.

Reference: [NOTIFICATION_SYSTEM_REBUILD_PROMPT.md](NOTIFICATION_SYSTEM_REBUILD_PROMPT.md).

---

## Platform Admin

| Event name | Origin | Recipient rules | Delivery | Priority | Link target | Status |
|------------|--------|-----------------|----------|----------|-------------|--------|
| New institution created / onboarded | `POST /api/institution/onboarding/complete` (when creating first institution) | All PLATFORM_ADMIN users | in-app + email | HIGH | `/platform-admin/institutions` | **implemented** |
| Institution status changed (approved/suspended) | Platform admin institution update route | All PLATFORM_ADMIN (or institution admins if status affects them) | in-app + email | MEDIUM | `/platform-admin/institutions/[id]` | missing |
| Critical system alerts (cron failures, critical flag changes) | Cron / background jobs | PLATFORM_ADMIN | in-app + email | URGENT | `/platform-admin/system-health` or similar | missing |
| Bulk invite progress + results (sent/failed/retried) | `POST /api/invites/bulk` | Caller (PLATFORM_ADMIN or INSTITUTION_ADMIN who ran bulk) | in-app | MEDIUM | `/platform-admin/invites` or `/institution/invites` | **implemented** |
| Audit log critical actions (boss mode changes applied/failed) | Audit mutation / mutateWithAudit | PLATFORM_ADMIN | in-app | HIGH | `/platform-admin/audit-logs` | missing |

---

## QCTO

| Event name | Origin | Recipient rules | Delivery | Priority | Link target | Status |
|------------|--------|-----------------|----------|----------|-------------|--------|
| New Form 5 readiness submitted | `PATCH /api/institutions/readiness/[readinessId]` (readiness_status = SUBMITTED) | QCTO reviewers/admins (assigned) | in-app + email | HIGH | `/qcto/readiness/[readinessId]` | **implemented** |
| Readiness record assigned / re-assigned to reviewer/auditor | `POST /api/qcto/reviews/assign` | Assigned user(s) | in-app + email | HIGH | `/qcto/readiness/[readinessId]` | **implemented** |
| Review status: under review, returned, recommended, rejected | `PATCH /api/qcto/readiness/[readinessId]/review` | Institution admins | in-app + email | HIGH/URGENT | `/institution/readiness/[readinessId]` | **implemented** |
| Document/evidence flag raised | `POST /api/qcto/documents/[documentId]/flag` | Document owner (uploader) | in-app + email | MEDIUM | `/institution/readiness/[readinessId]` or documents | **implemented** |
| Document/evidence flag resolved | `POST /api/qcto/documents/[documentId]/accept` (resolves flags) | Institution admins | in-app | LOW | `/institution/readiness/[readinessId]` | missing |
| Messages from support/admin (pinned announcements) | Announcements API | Target roles (QCTO, etc.) | in-app | MEDIUM | `/announcements` or inline | partial (announcements exist) |

---

## Institution Admin / Staff

| Event name | Origin | Recipient rules | Delivery | Priority | Link target | Status |
|------------|--------|-----------------|----------|----------|-------------|--------|
| Invite accepted / user joined | `POST /api/invites/accept` | Institution admins for that institution (UserInstitution role ADMIN) | in-app + email | LOW | `/institution/staff` or invites | **implemented** |
| Form 5 readiness returned for correction with notes | `PATCH /api/qcto/readiness/[readinessId]/review` (RETURNED_FOR_CORRECTION) | Institution admins | in-app + email | HIGH | `/institution/readiness/[readinessId]` | implemented (after fix) |
| Missing documents / validation warnings | Readiness validation or document checks | Institution admins | in-app | MEDIUM | `/institution/readiness/[readinessId]` | missing |
| Submission status changes (approved/rejected/under review) | `PATCH /api/qcto/submissions/[submissionId]` | Submission owner | in-app + email | HIGH/URGENT | `/institution/submissions` or detail | implemented |
| Document flagged by QCTO | `POST /api/qcto/documents/[documentId]/flag` | Document uploader | in-app + email | MEDIUM | `/institution/readiness/[readinessId]` | **implemented** |
| Announcements (pinned) | Announcements | Target roles (institution) | in-app | MEDIUM | Announcements | partial |

---

## Students

| Event name | Origin | Recipient rules | Delivery | Priority | Link target | Status |
|------------|--------|-----------------|----------|----------|-------------|--------|
| Invite accepted / onboarding complete | `POST /api/invites/accept` + onboarding complete | Student (self) | in-app | INFO | `/student` | missing |
| Profile verification updates (approved/rejected/needs changes) | Verification flow | Student | in-app + email | MEDIUM | `/student` or profile | missing |
| Submissions progress | If students have submissions | Student | in-app | MEDIUM | Student submission page | missing |
| Admin/support messages | Announcements | Students (target_roles) | in-app | MEDIUM | Announcements | partial |

---

## Summary by status

- **Implemented:** Readiness review (recommended/rejected/under review/returned for correction), Submission review (approved/rejected/under review), Invite accepted (→ institution admins), New institution created (→ platform admins), Bulk invite completed (→ caller), Readiness submitted (→ assigned QCTO reviewers), Review assigned (→ assignees), Document flagged (→ uploader), Issue response (→ reporter). Batch mark-all-read API; role-aware notification links (QCTO vs institution); bell styling and 9+ badge.
- **Partial:** Announcements (no in-app “notification” row per user; announcements are a separate feed).
- **Missing:** Institution status changes, system/cron alerts, audit critical, document/flag resolved (→ institution), student-facing events, missing documents/validation warnings.

---

## Recipient scoping rules (enforced)

- Every notification row has a single `user_id` (recipient). Group notifications = one row per recipient.
- GET /api/notifications: `WHERE user_id = session.user.id` only; never from input.
- PATCH: user can only mark own notifications (or PLATFORM_ADMIN for support).
- All server-side creation via `createNotification()` or helpers with recipient from server-derived list (never client-supplied user_id for recipients).

---

## Proof checks (manual test steps)

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Institution submits readiness → QCTO reviewers notified; link to QCTO readiness | (manual) | As institution, submit a readiness record; as QCTO assigned reviewer, open notifications and confirm "New Readiness Record Submitted" and link goes to `/qcto/readiness/[id]`. |
| QCTO returns/recommends/rejects → Institution admins notified; link to institution readiness | (manual) | As QCTO, set status to Returned/Recommended/Rejected; as institution admin, confirm notification and link to `/institution/readiness/[id]`. |
| User accepts invite → Institution admin(s) notified | (manual) | Send invite; accept as new or existing user; as institution admin (UserInstitution role ADMIN), confirm "Invite Accepted" notification. |
| Platform admin critical change → Admins notified (if flow exists) | (manual) | N/A if no boss-mode flow. |
| Cross-account: User A never sees User B's notifications | (manual) | Log in as user A; create notification for user B via seed or API; GET /api/notifications as A must not return B's notification. |
| Unread count matches list; mark read / mark all read persist | (manual) | Open panel; confirm unread count matches list; mark one read → count decrements; "Mark all read" → count 0; refresh and confirm persisted. |
| Bell + panel work in light and dark mode | (manual) | Toggle theme; confirm bell border/hover and badge (destructive variant), panel and empty state readable in both. |

---

## Remaining TODOs (after implementation)

- DB-backed notification preferences; email gating by user preference.
- Optional "Critical" filter tab when priority is stored in DB.
- Lazy-load more in panel on scroll (e.g. load more when scrolling to bottom).
- Document/evidence flag resolved → notify institution (when flag is resolved in accept route).

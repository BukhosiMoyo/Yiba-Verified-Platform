# Notification Profile & Scoping – Implementation Prompt

**Goal:** Ensure every notification is linked to the correct user’s profile and only contains information that relates to them. No user may receive another user’s notifications (submissions, messages, issues, readiness, etc.).

Use this prompt as a detailed checklist when implementing or auditing notification creation, listing, and mark-read behaviour.

---

## 1. Core principle

- **Recipient = owner or relevant party:** Each notification has a `user_id` (recipient). That recipient must be derived **only** from the entity being acted on (e.g. submission owner, issue reporter, institution admins for a readiness record), **never** from:
  - Client-supplied `user_id` in the request body (unless the API explicitly restricts and validates it, e.g. platform admin only).
  - The “actor” (person performing the action) unless the notification is intentionally “to self” (e.g. “You submitted …”).
- **List and update only own:**  
  - **GET** notifications: return only rows where `user_id = current authenticated user`.  
  - **PATCH** mark-as-read: allow only when the notification’s `user_id` equals the current user (or when the caller is a defined admin role allowed to act on behalf of users).

---

## 2. Scoping rules by layer

### 2.1 Creation (who gets the notification?)

| Entity / Event | Correct recipient(s) | Derived from | Wrong recipient |
|----------------|----------------------|--------------|------------------|
| **Submission** reviewed (approved/rejected/under review) | User who submitted | `Submission.submitted_by` | Reviewer, random user, client body |
| **Readiness** reviewed (recommended/rejected/under review/returned) | Institution admins for that readiness | `Readiness.institution_id` → users with `institution_id` and role INSTITUTION_ADMIN or INSTITUTION_STAFF | QCTO reviewer, client body |
| **QCTO Request** approved/rejected | User who owns the request | Request record owner (e.g. institution or creator) | Approver, client body |
| **Issue / Bug report** response | User who reported the issue | `IssueReport.reportedBy` | Admin who responded, client body |
| **Document** flagged | User who “owns” the document in your model | Document → owner (e.g. uploader or linked user) | Flaager, client body |
| **Chat / New message** (if you add in-app notifications) | Other participants in the conversation, **excluding** the sender | Conversation members minus sender | Sender, non-members, client body |
| **System / admin alert** | Only when targeting a specific user; recipient must be decided server-side from policy/role, not from client | Server-side rule (e.g. “notify institution admins”, “notify submitter”) | Arbitrary user from request |

Rule when adding new notification types:  
**Recipient = f(entity, event)** implemented in server code only. Never take recipient directly from client input unless the API explicitly restricts who can set it (e.g. only platform admin, with audit).

### 2.2 Listing (GET /api/notifications)

- **Filter:** `where: { user_id: ctx.userId }` (or equivalent). `ctx.userId` must be the authenticated user’s id from the session/token.
- **Never:**  
  - Return notifications for other users.  
  - Add a “user_id” query param that allows callers to list another user’s notifications (unless it’s an admin endpoint with explicit access control and audit).
- **Pagination / filters:** All filters (e.g. `is_read`, `limit`, `offset`) apply **on top of** `user_id = ctx.userId`.

### 2.3 Mark as read (PATCH /api/notifications/[notificationId])

- **Check ownership:** Allow update only if `notification.user_id === ctx.userId` (or if the caller is a defined admin role allowed to perform this on behalf of users).
- **Never:** Allow marking another user’s notification as read based only on knowing the `notificationId`; always enforce `user_id` ownership (or admin policy).

---

## 3. Call-site audit checklist

For each place that creates a notification, verify:

1. **Recipient source**  
   - Is `user_id` / recipient taken only from the **entity** (DB/models) or from server-side rules?  
   - If it ever comes from the request body, is that path restricted (e.g. platform admin only) and validated?

2. **Entity ownership**  
   - For “your X was updated” notifications, does the chosen recipient actually own or care about that entity (submitter, reporter, institution admins, etc.)?

3. **No cross-user leakage**  
   - Could this code path ever run with the wrong recipient (e.g. passing the reviewer’s id instead of the submitter’s)?

### 3.1 Current creation paths (verify and keep as per this doc)

- **`Notifications.submissionReviewed(userId, submissionId, status)`**  
  - Caller must pass `userId = submission.submitted_by`.  
  - Used in: `PATCH /api/qcto/submissions/[submissionId]` – confirm it uses `submissionOwner.submitted_by`.

- **`Notifications.readinessReviewed(userId, readinessId, status)`**  
  - Caller must pass `userId` = institution admin’s `user_id` for that readiness’s institution.  
  - Used in: `PATCH /api/qcto/readiness/[readinessId]/review` – confirm it uses users from `institution_id` and correct roles (e.g. INSTITUTION_ADMIN / INSTITUTION_STAFF), and that it notifies **all** such admins, not the QCTO reviewer.

- **`Notifications.requestApproved(userId, requestId)` / `requestRejected`**  
  - When you add call sites, `userId` must be the **owner of the QCTO request** (e.g. the institution or user who created it), not the approver.

- **`Notifications.documentFlagged(userId, documentId)`**  
  - When you add call sites, `userId` must be the **owner of the document** (e.g. uploader or linked user), not the person who flagged it.

- **`prisma.notification.create` in `POST /api/issues/[issueId]/respond`**  
  - Recipient must be `issue.reportedBy` (reporter).  
  - Confirm the code uses `issue.reportedBy` (or equivalent) and not `ctx.userId` (admin).

- **`POST /api/notifications`**  
  - Body may include `user_id`.  
  - Enforce: only allow creating a notification for another user when `ctx.role === "PLATFORM_ADMIN"`; otherwise allow only `user_id === ctx.userId`.  
  - Any caller (e.g. internal services or future webhooks) must be trusted to send the correct `user_id`; do not expose this as a general-purpose client API without the above checks.

### 3.2 Messages / chat (when you add in-app notifications)

If you add “new message” or “new chat” notifications:

- **Recipients** = conversation participants **excluding** the message sender.
- **Source of recipient list** = conversation membership from the DB (e.g. `ConversationMember` where `leftAt` is null), not from the client.
- **Scope** = only conversations the recipient is a member of; never notify users who are not in that conversation.

---

## 4. Security rules (summary)

1. **Listing:** Always filter notifications by `user_id = ctx.userId`. No optional “view as userId” for normal users.
2. **Mark read:** Always ensure `notification.user_id === ctx.userId` (or allowed admin) before updating.
3. **Creation:**  
   - Prefer helpers like `Notifications.*` that take `(userId, entityId, …)` and ensure callers pass the **entity owner / relevant party** as `userId`.  
   - If using `prisma.notification.create` or `POST /api/notifications`, never set `user_id` from unsanitized client input unless the route restricts it (e.g. platform admin only) and you have validated the target user.
4. **New notification types:** Document “who is the recipient?” and “where do we get that id?” in code or specs; implement that logic server-side only.

---

## 5. Impersonation / “View as user”

If the app supports “view as user” (e.g. platform admin viewing as another user):

- **Notification list:** When the effective user is the “viewed” user, `ctx.userId` (or equivalent) should be that viewed user so the list shows **their** notifications only.
- **Mark as read:** Same rule: only allow updates for notifications that belong to the **effective** user (the one being viewed), and only when the actor is allowed to perform “view as” (e.g. platform admin).
- Ensure the auth/context layer defines clearly whether `ctx.userId` is the real viewer or the viewed user in each route, and that notification routes use that consistently.

---

## 6. Testing requirements

Add or extend tests to lock in behaviour:

1. **Listing**  
   - User A fetches notifications → only notifications with `user_id = A` are returned.  
   - User A never sees User B’s notifications, even if A knows B’s notification ids or uses pagination.

2. **Mark as read**  
   - User A can mark their own notification as read.  
   - User A cannot mark User B’s notification as read (e.g. 403 or 404 when trying by id).

3. **Creation**  
   - For each notification type, at least one test that creates a notification and asserts the stored `user_id` is the **intended** recipient (e.g. submitter for submission review, reporter for issue response).  
   - If you have an API that accepts `user_id` in the body, tests that a non-admin cannot create a notification for another user.

4. **Message notifications (when added)**  
   - When user A sends a message in a conversation with B and C, only B and C receive “new message” notifications, and only for that conversation.

---

## 7. Files to touch when applying this prompt

- **Creation**  
  - `src/lib/notifications.ts` – helpers and `createNotification`.  
  - `src/app/api/notifications/route.ts` – POST body and `user_id` checks.  
  - `src/app/api/issues/[issueId]/respond/route.ts` – use `issue.reportedBy`.  
  - `src/app/api/qcto/submissions/[submissionId]/route.ts` – use `submissionOwner.submitted_by`.  
  - `src/app/api/qcto/readiness/[readinessId]/review/route.ts` – use institution admins for `readiness.institution_id`.  
  - Any future call sites for `Notifications.requestApproved/Rejected`, `documentFlagged`, or message notifications.

- **Listing & mark read**  
  - `src/app/api/notifications/route.ts` – GET `where.user_id`.  
  - `src/app/api/notifications/[notificationId]/route.ts` – PATCH ownership check.

- **Context**  
  - `src/lib/api/context.ts` (or equivalent) – ensure `ctx.userId` used by notification routes is the effective user (viewed user when in “view as” mode, if you support it).

---

## 8. One-line reminder

**“Notifications are always about the recipient’s own things (their submissions, their messages, their issues, their readiness, etc.). Recipient is always derived from the entity on the server; listing and mark-read are always scoped to the current user.”**

Use this prompt when implementing new notification types, new API endpoints that create or list notifications, or when auditing existing code for profile/scoping bugs.

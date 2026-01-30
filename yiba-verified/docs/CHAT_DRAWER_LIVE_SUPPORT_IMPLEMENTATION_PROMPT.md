# Chat Drawer & Live Support Enhancement – Implementation Prompt

Use this as the implementation specification for improving the Chat Drawer design and turning the Support tab into a proper live-chat experience.

---

## Context

- **Chat Drawer**: `src/components/chat/ChatDrawer.tsx` – fixed drawer with header, conversation list, and message view.
- **Conversation list**: `src/components/chat/ConversationList.tsx` – tabs (All, Inbox, Support, Archived), search, and `ConversationItem` rows.
- **Avatar & verification**: `src/components/chat/ChatAvatar.tsx` uses `VerifiedBadge` from `VerifiedBadge.tsx`; badge is currently at bottom-right of avatar.
- **Types**: `src/components/chat/types.ts` – `Conversation` has `isSupport`, `unreadCount`, `otherMembers`; `ChatUser` has `verificationLevel`.
- **APIs**: `src/app/api/chat/` – conversations, messages, read, heartbeat; support conversations are created with `type: "SUPPORT"` and filtered by `isSupport`.

---

## 1. Unread Chats Visibility

**Goal:** Make unread conversations obvious at a glance.

**Current:** Small numeric badge on the avatar and a small badge next to the last message. Easy to miss when scanning the list.

**Requirements:**

- **Row-level emphasis for unread**
  - Give rows with `unreadCount > 0` a distinct background (e.g. `bg-primary/5` or `bg-blue-50` in light theme) so the whole row reads as “unread.”
  - Keep sufficient contrast and avoid overlapping with the “selected” state (e.g. `bg-primary/10` + left border).
- **Unread badge**
  - Keep a numeric unread badge, but make it more visible:
    - Slightly larger, higher contrast (e.g. primary or danger colour).
    - Optionally a “dot” or pill when count is 1, and “N” or “99+” when N > 1.
  - Position: same general area (e.g. top-right of the row or end of the name row), but ensure it doesn’t compete with the verified badge (see below).
- **Text weight**
  - For unread rows, show name and/or last message in bolder font so they stand out in the list.
- **Accessibility**
  - Ensure unread state is clear for keyboard/screen-reader users (e.g. `aria-label` like “X unread messages” on the row or badge).

**Best practices:** Use theme tokens (`bg-primary/5`, `text-foreground` vs `text-muted-foreground`) so it works in light/dark. Reuse or extend existing `ConversationItem` in `ConversationList.tsx` rather than duplicating layout logic.

---

## 2. Verified Checkmark Placement

**Goal:** Show verification clearly without cluttering the avatar, and align with user expectation (“verified” next to the name).

**Current:** Small checkmark overlay at bottom-right of the avatar, which can clash with unread badge or online indicator.

**Requirements:**

- **Primary: end of display name**
  - In `ConversationItem`, show the verified badge **immediately after the conversation display name** (e.g. “QCTO Super Admin” + checkmark), not on the avatar.
  - Use a small, readable icon (e.g. `VerifiedBadge` with `size="sm"` or `"md"`) and consistent colour from `VerifiedBadge` (e.g. blue/green/gold by `verificationLevel`).
  - Layout: inline with the name, with a tiny gap; keep the name truncating correctly and the badge visible (e.g. flex row, `truncate` on name, `flex-shrink-0` on badge).
- **Avatar behaviour**
  - **Remove** the verification badge from the avatar in `ChatAvatar.tsx` when the avatar is used in the conversation list, **or** make it configurable via a prop (e.g. `showVerificationOnAvatar?: boolean` default `false` for list items).
  - In list context, avatar should only show: image/initials, group icon, online indicator, and optionally unread count badge — not verification.
- **Consistency**
  - Wherever a conversation or user name is shown with verification (e.g. list, header, full-page chat), use the same rule: verification badge at end of name, not on the avatar, unless a specific screen needs it on the avatar and opts in via prop.

**Best practices:** One source of truth for “is verified” (`otherMember.verificationLevel` / `VerificationLevel`). Reuse `VerifiedBadge` from `VerifiedBadge.tsx` and pass `level={otherMember?.verificationLevel}` so colours stay consistent.

---

## 3. Support Tab as Live Chat

**Goal:** The Support tab should behave as a **live chat** channel: user requests help, is queued, sees “wait for next agent,” and gets a contextual, personalised experience (greeting, user summary, contact history). It must not feel like a generic 1:1 chat.

**Requirements:**

### 3.1 Entry and queue

- **Support tab as entry**
  - When the user is on the **Support** tab and has no active support conversation (or only closed/archived ones), show a dedicated **“Start live chat”** (or “Request support”) UI instead of the generic “No messages yet” + “Start a conversation.”
- **Request flow**
  - On “Start live chat,” create or resume a support conversation (reuse existing `type: "SUPPORT"` conversation creation in `POST /api/chat/conversations` with `type: "SUPPORT"`).
  - Immediately show a **queue/waiting state** in the support thread:
    - Message or banner: e.g. “You’re in the queue. Please wait for the next available agent.”
    - Optional: “Your position in queue” or “Typical wait: X min” if the backend can provide it later.
  - Disable or hide the composer for sending new messages until an agent has joined or the backend marks the session as “agent_active” (or equivalent), **or** allow a single “initial request” message that is shown to the agent when they join. The spec should be explicit: either “user cannot send until agent joins” or “user can send one message that goes into the queue.”
- **Backend**
  - Add or reuse a field/table to represent “support session status” (e.g. `QUEUED` | `AGENT_JOINED` | `CLOSED`). The API that creates/returns the support conversation should expose this so the UI can show the right state (waiting vs chat active).

### 3.2 User context for the agent (and optionally for the user)

- **When the user enters live chat (or when an agent joins), the system must load and expose:**
  - **User summary:** role, institution (if any), email, name — enough for the agent to know who they’re talking to.
  - **Contact count:** “Number of times this user has contacted support” (or “Previous support conversations: N”). Persist this in the DB (e.g. count of support conversations or support sessions for this user) and expose it via the conversation/session API so the agent UI can show it.
- **Where to show**
  - **Agent side:** In the support conversation view (or in a sidebar/panel for that conversation), show “User info” and “Prior contacts: N” (and optionally a short list of prior support topics or dates).
  - **User side (optional but recommended):** In the support thread, show a short “You’re chatting as [Name], [Role], [Institution]” and “You’ve contacted support N time(s) before” so the experience feels transparent and personalised.

### 3.3 Greeting and “How can we help?”

- **When the support session becomes active (agent has joined or first message is allowed):**
  - Insert or show a **system or agent greeting** in the thread, e.g. “Hi [FirstName], thanks for reaching out. How can we help you today?”
  - Prefer a short, standardisable template (e.g. “Hi {{firstName}}, thanks for contacting support. How can we help you today?”) that can be filled with the user’s name and, if desired, role/institution.
- **Placement**
  - Shown as the first visible message in the support thread (or immediately after the “You’re in the queue…” message when the agent joins), so the user sees it as soon as the live chat “starts.”
- **Implementation options**
  - Send a system message (e.g. `messageType: "SYSTEM"` or a “greeting” subtype) when the session becomes active, or render a dedicated “greeting” block in the message list when `isSupport && sessionActive && noUserMessagesYet`. Prefer one consistent approach so analytics and UI stay simple.

### 3.4 UX copy and behaviour

- **Copy**
  - Support tab empty state: “No active support chat” and “Start live chat” (or “Request help”).
  - In-queue: “Waiting for the next available agent…” (plus optional queue position or typical wait).
  - After agent joins: greeting as above, then normal composer for ongoing messages.
- **Support list**
  - In the Support tab, list only support conversations that are “active” or “recent” (e.g. not closed/archived, or show “Resume” for recent closed ones). Align with existing “Archived” behaviour so “Archived” stays the place for old/closed threads.

**Best practices:**

- Use existing `Conversation.type === "SUPPORT"` and `isSupport`; extend APIs only where needed (e.g. session status, contact count, greeting).
- Keep accessibility in mind: queue status and greeting must be readable by screen readers; use `role` and `aria-live` if you show dynamic status updates.
- Ensure mobile layout still works: support entry, queue banner, and user-context block should stack or collapse sensibly on small screens.

---

## 4. Technical Conventions

- **Component ownership**
  - Unread styling and verified-at-name: `ConversationList.tsx` and `ConversationItem`; optionally allow `ConversationItem` to receive a `showVerificationOnAvatar` (or similar) to keep `ChatAvatar` reusable.
  - Live-support entry, queue UI, and greeting: either inside the same `ConversationList` when `activeTab === "support"`, or in a dedicated `SupportTabContent` / `LiveSupportEntry` component used by `ConversationList` when on Support tab.
- **API**
  - Add or extend:
    - Support session status (e.g. `GET /api/chat/support/session` or on the conversation response).
    - User context for support: `GET /api/chat/support/context` or include in conversation/session payload: `{ userSummary, priorSupportContactCount }`.
    - Optional: `POST /api/chat/support/request` to create support convo and return session id + status.
  - Reuse `POST /api/chat/conversations` with `type: "SUPPORT"` for creating the conversation; add fields to the response as needed.
- **Data**
  - Persist “prior support contact count” (or equivalent) in the database; compute from existing support conversations or a dedicated table, and expose via the support/context or conversation API.
- **i18n**
  - All new user-facing strings (empty states, queue message, greeting template) should be in a way that supports i18n later (e.g. constants or t()-ready strings in one place).

---

## 5. Implementation Order

1. **Unread visibility** – Low risk, immediate value. Adjust `ConversationItem` layout and styles, then unread badge and optional aria labels.
2. **Verified at end of name** – Low risk. Move badge from avatar to name in `ConversationItem`; add prop to `ChatAvatar` to hide verification in list if needed.
3. **Support tab entry & queue** – Add “Start live chat,” create support conversation, show “Waiting for next agent” and session status; optional backend fields for queue/status.
4. **User context** – Backend: user summary + contact count; then agent UI and optionally user-facing summary in the support thread.
5. **Greeting** – When session becomes active, show “Hi [Name], how can we help?” (system or template message).

---

## 6. Definition of Done (Checklist)

- [ ] Unread conversations are visually obvious (row background + clear unread badge + text weight).
- [ ] Verified badge appears at the end of the display name in the conversation list, not on the avatar (or only on avatar where explicitly opted in).
- [ ] Support tab shows “Start live chat” when there is no active support conversation.
- [ ] After starting live chat, user sees a clear “Waiting for the next available agent” (or equivalent) until an agent joins.
- [ ] When the support session is active, a greeting is shown (“Hi [Name], how can we help you today?” or similar).
- [ ] Agent (or backend) has access to user summary and prior support contact count; user optionally sees a short summary of “who you are” and “you’ve contacted support N times.”
- [ ] All new strings are easy to find and ready for i18n.
- [ ] No regressions on Inbox/Archived or on non-support conversations; mobile and accessibility are preserved.

---

*Use this document as the single source of truth when implementing the Chat Drawer unread visibility, verified checkmark placement, and Support-tab live chat behaviour.*

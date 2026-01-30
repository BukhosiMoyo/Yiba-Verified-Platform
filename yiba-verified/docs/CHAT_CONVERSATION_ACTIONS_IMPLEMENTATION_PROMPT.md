# Chat Conversation Actions – Pin, Archive, Delete – Implementation Prompt

Use this as the implementation specification for adding **Pin**, **Archive**, and **Delete (leave)** actions to each conversation row in the chat list.

---

## Context

- **Conversation list**: `src/components/chat/ConversationList.tsx` – tabs (All, Inbox, Support, Archived), search, and `ConversationItem` rows. Each row is a `<button>` that selects the conversation.
- **Types**: `src/components/chat/types.ts` – `Conversation` has `isArchived`, `unreadCount`, `members`, etc. No `isPinned` yet.
- **Backend**: `ConversationMember` has `isArchived`, `leftAt`; conversations are listed via `GET /api/chat/conversations` which returns membership-derived fields (`isArchived`, `isMuted`). No membership update/leave APIs exist yet for the current user’s own membership.

---

## 1. Pin Chat

**Goal:** Let the user pin a conversation so it stays at the top of the list.

**Requirements:**

- **Data**
  - Add `isPinned Boolean @default(false)` to `ConversationMember` (user-level pin).
  - Persist via migration; backfill existing rows as `false`.
- **API**
  - Support updating “my” membership: e.g. `PATCH /api/chat/conversations/[conversationId]/membership` with body `{ isPinned?: boolean }`. Require auth; ensure the membership is for the current user; update only `isPinned`.
  - Or dedicated `POST .../pin` and `POST .../unpin` that set `isPinned` true/false.
- **List**
  - `GET /api/chat/conversations` must include `isPinned` from the current user’s membership in each conversation payload.
  - Sort order: pinned first (`isPinned DESC`), then by `lastMessageAt DESC` (or equivalent).
- **UI**
  - In `ConversationItem`, show a “Pin” / “Unpin” option. If the conversation is pinned, show “Unpin”; otherwise “Pin”. Call the pin/unpin API and refresh the list (or update local state from response).

**Best practices:** One source of truth (membership.isPinned). Use optimistic updates and rollback on failure if desired. Keep accessibility (keyboard, screen readers) for the new actions.

---

## 2. Archive Chat

**Goal:** Let the user archive a conversation so it only appears under the “Archived” tab.

**Requirements:**

- **Data**
  - Use existing `ConversationMember.isArchived`; no schema change.
- **API**
  - Support updating “my” membership: e.g. `PATCH /api/chat/conversations/[conversationId]/membership` with body `{ isArchived?: boolean }`. Require auth; ensure the membership is for the current user; update only `isArchived`.
  - Or dedicated `POST .../archive` and `POST .../unarchive`.
- **List**
  - `GET /api/chat/conversations` already returns `isArchived` from membership; filtering by “Archived” tab is already based on it. No change needed for list payload/query if archive is toggled via the same membership.
- **UI**
  - In `ConversationItem`, show “Archive” when the conversation is not archived, and “Unarchive” when it is. Call the archive/unarchive API and refresh the list (or update local state). If the user archives the currently selected conversation, consider closing the chat view or switching selection.

**Best practices:** Reuse existing `isArchived`; keep “Archived” tab behavior unchanged. After archive, optional toast: “Conversation archived.”

---

## 3. Delete Chat (Leave)

**Goal:** Let the user leave/delete a conversation so it no longer appears in their list.

**Requirements:**

- **Data**
  - Use existing `ConversationMember.leftAt`. “Leave” = set `leftAt` to `now()` for the current user’s membership. No new columns.
- **API**
  - `POST /api/chat/conversations/[conversationId]/leave` (or `DELETE .../membership`). Require auth; ensure the membership is for the current user; set `leftAt = new Date()`. Return success.
  - List API already excludes left members (e.g. `leftAt: null` in membership filter); no change needed if that’s already in place.
- **UI**
  - In `ConversationItem`, show “Delete” or “Leave chat”. Confirm before leave (e.g. “Leave this conversation? You can be re-added by someone else.”). On confirm, call leave API and refresh the list. If the user leaves the currently selected conversation, clear selection and close the chat view.
  - Use destructive styling for this action (e.g. `text-destructive` or `variant="destructive"`).

**Best practices:** Soft leave only; do not delete conversation or messages. Optional toast: “You left the conversation.” Ensure “Delete” is clearly “leave,” not “delete for everyone.”

---

## 4. UI Placement and Behavior

**Goal:** Expose Pin, Archive, and Delete without cluttering the row or blocking the main “select conversation” action.

**Requirements:**

- **Trigger**
  - Add a secondary control on each row: e.g. a “more” (three-dots or chevron) button that opens a dropdown. The main row click still selects the conversation. The “more” click must use `stopPropagation()` so it doesn’t select the conversation.
- **Dropdown**
  - Use a `DropdownMenu` (or equivalent) with items:
    - **Pin** / **Unpin** (icon + label)
    - **Archive** / **Unarchive** (icon + label)
    - **Delete** / **Leave** (icon + label, destructive)
  - Show Pin/Unpin and Archive/Unarchive based on current state. Show “Delete” or “Leave chat” with a confirm step (dialog or inline confirm).
- **Accessibility**
  - “More” button: `aria-label="Conversation options"` or “Open menu for [conversation name]”.
  - Menu items: clear labels and keyboard navigation. Escape closes the menu.
- **Loading**
  - While an action is in progress, disable the menu item or show a loading state. Optionally show a small loading indicator on the row.
- **Refresh**
  - After pin/unpin, archive/unarchive, or leave: refetch the conversation list (or update the list from the API response) so the list and tabs stay correct. Parent must support a callback (e.g. `onConversationAction`) or refetch when the drawer/page regains focus, or the list component can call `onRefresh` passed from parent.

**Best practices:** Reuse existing `DropdownMenu` from `@/components/ui/dropdown-menu`. Use icons (e.g. Pin, Archive, Trash2) from `lucide-react` for consistency. Avoid nesting too many clicks (e.g. one click to open menu, one to action; confirm only for leave).

---

## 5. API Design Summary

- **Membership update (pin + archive)**  
  - `PATCH /api/chat/conversations/[conversationId]/membership`  
  - Body: `{ isPinned?: boolean, isArchived?: boolean }`  
  - Auth: required. Update only the current user’s membership. Return updated membership or 204.

- **Leave**  
  - `POST /api/chat/conversations/[conversationId]/leave`  
  - Body: none (or `{}`). Set `leftAt = new Date()` for the current user’s membership. Return 200/204.

- **List**  
  - `GET /api/chat/conversations`: include `isPinned` from the current user’s membership; sort pinned first, then by lastMessageAt.

---

## 6. Implementation Order

1. **Schema**: Add `isPinned` to `ConversationMember`; run migration.
2. **APIs**: Implement `PATCH .../membership` and `POST .../leave`; extend `GET /api/chat/conversations` to return `isPinned` and sort pinned first.
3. **Types**: Add `isPinned?: boolean` to the conversation type used by the frontend.
4. **UI**: Add “more” dropdown to `ConversationItem` with Pin/Unpin, Archive/Unarchive, Leave (with confirm). Wire actions to APIs and refresh list.

---

## 7. Definition of Done

- [ ] User can pin/unpin a conversation; pinned conversations appear at the top.
- [ ] User can archive/unarchive a conversation; archived conversations only appear under “Archived” tab.
- [ ] User can leave a conversation after confirmation; conversation disappears from their list.
- [ ] Row main click still selects the conversation; “more” menu does not trigger selection.
- [ ] All new strings are suitable for i18n later.
- [ ] No regressions on unread, verification badge, or support-tab behavior.

---

*Use this document as the single source of truth when implementing Pin, Archive, and Delete (leave) for conversation list items.*

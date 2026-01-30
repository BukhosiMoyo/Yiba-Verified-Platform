# Chat System: Delete Current Implementation and Recreate with Best Practices

## Overview

This prompt instructs to **delete** the current in-app chat/messaging implementation and **recreate** it using best practices: clear schema, consistent APIs, denormalized previews, sync script, and modern UI patterns.

---

## Part 1: Delete the Current Chat Implementation

### 1.1 Remove API routes

Delete the entire chat API tree:

- `src/app/api/chat/` (entire directory)
  - `unread/route.ts`
  - `conversations/route.ts`
  - `conversations/[conversationId]/route.ts`
  - `conversations/[conversationId]/messages/route.ts`
  - `conversations/[conversationId]/messages/[messageId]/react/route.ts`
  - `conversations/[conversationId]/read/route.ts`
  - `conversations/[conversationId]/leave/route.ts`
  - `conversations/[conversationId]/delete/route.ts`
  - `conversations/[conversationId]/membership/route.ts`
  - `users/route.ts`
  - `heartbeat/route.ts`
  - `support/context/route.ts`

Also remove platform-admin chat API if it depends on chat:

- `src/app/api/platform-admin/chats/route.ts` (if it only serves chat; remove or repurpose as needed)

### 1.2 Remove app pages and layout

- `src/app/chat/` (entire directory: `page.tsx`, `layout.tsx`, `ChatPageClient.tsx`)
- `src/app/platform-admin/chats/` (entire directory: `page.tsx`, `ChatsPageClient.tsx`) — or keep a stub that links to the new chat

### 1.3 Remove chat components

- `src/components/chat/` (entire directory), including:
  - `ChatAvatar.tsx`, `ChatButton.tsx`, `ChatDrawer.tsx`, `ChatHeader.tsx`
  - `Composer.tsx`, `ConversationList.tsx`, `MessageBubble.tsx`, `MessageList.tsx`
  - `NewChatDialog.tsx`, `EmojiPicker.tsx`, `useOnlineStatus.ts`, `VerifiedBadge.tsx`
  - `types.ts`, `index.ts`

### 1.4 Remove chat from layout/navigation

- In `src/components/layout/Topbar.tsx`: remove `ChatButton` and any chat-related UI.
- In `src/components/layout/Sidebar.tsx` or nav config: remove chat links (e.g. `/chat`).
- In `src/components/layout/nav.ts` (or equivalent): remove chat route and label.

### 1.5 Remove database schema and migrations (optional approaches)

**Option A – Full reset (dev only)**  
- Remove Prisma models: `Conversation`, `ConversationType`, `ConversationMember`, `ConversationRole`, `Message`, `MessageType`, `MessageStatus`, `MessageAttachment`, `MessageReaction`.
- Remove relations from `User` and `Institution` that reference these (e.g. `createdConversations`, `conversationMemberships`, `sentMessages`, `messageReactions`, `institution` on Conversation).
- Create a new migration that drops the chat tables (and optionally the chat-related migrations from the migrations folder). Only use in environments where chat data can be discarded.

**Option B – Keep schema, wipe data (safer)**  
- Keep the Prisma chat models and migrations as-is.
- Do **not** delete schema or migrations; Part 2 will assume the same (or an evolved) schema and will describe best-practice usage and any new migrations (e.g. indexes) if needed.

Choose Option A only for a greenfield rebuild where losing chat data is acceptable; otherwise use Option B.

### 1.6 Remove or keep scripts

- **Remove** or repurpose: `scripts/sync-messages-best-practices.ts` (and `sync:messages` / `sync:messages:dry` from `package.json`) if you are doing a full delete. When recreating, re-add a sync script per Part 2.
- If using Option B, keep the script; it aligns with best practices.

### 1.7 Clean up references

- Search the codebase for imports or references to: `@/components/chat`, `/api/chat`, `/chat`, `ChatButton`, `ChatDrawer`, `ConversationList`, etc. Remove or update them so nothing points at the deleted chat.

---

## Part 2: Recreate the Chat System with Best Practices

### 2.1 Schema best practices

- **Conversation**
  - Fields: `id`, `type` (DIRECT | GROUP | SUPPORT), `name`, `description`, `avatarUrl`, `createdBy`, `institutionId`, `isSupport`, `lastMessageAt`, `lastMessageText`, `pinnedMessageId`, `createdAt`, `updatedAt`.
  - **Best practice:** Denormalize `lastMessageAt` and `lastMessageText` on the conversation for list sorting and previews; update them on every new message (see 2.4).
  - Indexes: `createdBy`, `institutionId`, `type`, `isSupport`, `lastMessageAt`.

- **ConversationMember**
  - Fields: `id`, `conversationId`, `userId`, `role`, `joinedAt`, `lastReadAt`, `lastReadMsgId`, `isMuted`, `isArchived`, `isPinned`, `leftAt`, `deletedAt`.
  - **Best practice:** Use `deletedAt` for soft-delete (user “deleted” chat); use `lastReadAt` and `lastReadMsgId` together for read receipts.
  - Indexes: `(conversationId, userId)` unique, plus `conversationId`, `userId`, `lastReadAt`.

- **Message**
  - Fields: `id`, `conversationId`, `senderId`, `content`, `messageType`, `status`, `isAdminMessage`, `replyToId`, `metadata`, `editedAt`, `deletedAt`, `createdAt`.
  - **Best practice:** Soft delete via `deletedAt`; exclude deleted messages from list/message APIs.
  - Indexes: `conversationId`, `senderId`, `createdAt`, `(conversationId, createdAt)`.

- **MessageAttachment**, **MessageReaction**  
  - Keep as-is with proper foreign keys and indexes.

- **User / Institution**  
  - Restore or add relations required for Conversation, ConversationMember, Message (e.g. `createdConversations`, `conversationMemberships`, `sentMessages`, `messageReactions`, support chat relation on Institution).

### 2.2 API best practices

- **Auth:** Every chat route must use the same auth helper (e.g. `requireAuth(req)`) and return 401 when unauthenticated.
- **GET /api/chat/unread**  
  - Return `{ unreadCount }` for the current user.  
  - Only count messages in conversations where the user is a member, not left, and not soft-deleted (`deletedAt` null on membership).  
  - On schema/DB errors in development, return a safe response (e.g. `unreadCount: 0`) and log the error; in production avoid leaking details.

- **GET /api/chat/conversations**  
  - Return list of conversations for the current user (exclude left and soft-deleted memberships unless admin with `?includeDeleted=true`).  
  - **Best practice:** Include `lastMessageAt` and `lastMessageText` on each conversation. If they are null (e.g. old data), backfill from the latest non-deleted message in that conversation so the list always shows a correct preview.

- **GET /api/chat/conversations/[conversationId]**  
  - Return a single conversation with members and pinned message.  
  - **Best practice:** Include `lastMessageText` (and `lastMessageAt`) in the response so clients that open by ID get the same preview shape as the list.

- **POST /api/chat/conversations**  
  - Create DIRECT / GROUP / SUPPORT conversations; for DIRECT, deduplicate by existing two-member conversation.

- **GET /api/chat/conversations/[conversationId]/messages**  
  - Paginate by `limit` and optional `before` (message id).  
  - Filter out `deletedAt` messages.  
  - Return read receipt info (e.g. other members’ `lastReadAt`) so clients can show “read” status.

- **POST /api/chat/conversations/[conversationId]/messages**  
  - Create message; then **update the conversation’s `lastMessageAt` and `lastMessageText`** (best practice: denormalize on write).  
  - Update sender’s `ConversationMember.lastReadAt` and `lastReadMsgId`.

- **POST /api/chat/conversations/[conversationId]/read**  
  - Set current user’s `lastReadAt` and `lastReadMsgId` for that conversation.

- **Leave, delete, membership (pin/archive), users, heartbeat, support context**  
  - Recreate as needed with the same semantics; ensure membership checks and soft-delete (`deletedAt`) are respected.

- **Errors:** Use try/catch; in development return a clear error message (and optional stack) in the JSON body; in production return a generic message. For missing tables/columns, suggest running migrations.

### 2.3 UI best practices

- **Entry points:** Chat button in the top bar (or sidebar) opening a drawer; optional full-page `/chat` for a dedicated inbox.
- **Conversation list (drawer or page):**
  - Show avatar, name, **last message preview** (`lastMessageText` or “No messages yet”), and **time** (`lastMessageAt`).
  - Support tabs/filters: e.g. Inbox, Support, Archived.
  - Search by name and/or last message text.
- **Message list:** Chronological order (newest at bottom); load more (paginate) with “before” cursor; show read receipts where applicable.
- **Composer:** Send text; optional reply, attachments, emoji; optimistic update with rollback on failure.
- **Unread badge:** Use GET `/api/chat/unread`; show count on the chat button; refresh after closing drawer or on a timer.
- **New conversation:** Modal or inline flow to pick user(s) and create DIRECT/GROUP; then open that conversation and show it in the list (merge with existing list so it is not overwritten by a stale fetch).

### 2.4 Sync script (best practices)

- Provide a script (e.g. `scripts/sync-messages-best-practices.ts`) that:
  1. **Conversations:** For each conversation, set `lastMessageAt` and `lastMessageText` from the latest non-deleted message (idempotent).
  2. **ConversationMember:** For each member with `lastReadAt`, set `lastReadMsgId` to the latest message at or before that time (read receipt consistency).
- Use transactions for consistency; support a `DRY_RUN` mode.
- Add npm scripts: e.g. `sync:messages`, `sync:messages:dry`.

### 2.5 Migrations

- If you chose Option A (full delete): add a single migration that creates all chat tables and enums (Conversation, ConversationMember, Message, MessageAttachment, MessageReaction and indexes/FKs). Optionally use `CREATE TABLE IF NOT EXISTS` and idempotent enum/constraint creation so the migration is safe on existing DBs that already have some chat tables.
- If you chose Option B: add any new indexes or columns required by the best-practice schema above; do not drop existing chat tables.

### 2.6 Testing and verification

- After recreate: open chat, create a DIRECT conversation, send messages, confirm list shows last message preview and time.
- Run the sync script (dry run then real run) and confirm conversations and members stay consistent.
- Confirm unread count and read receipts behave as expected.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Delete `src/app/api/chat/`, chat app pages, `src/components/chat/`, and chat usage from layout/nav. |
| 2 | Choose Option A (drop schema/migrations and recreate) or Option B (keep schema, wipe data if needed). |
| 3 | Recreate schema (if A) or adjust schema (if B) per 2.1. |
| 4 | Recreate all chat API routes per 2.2 with auth, error handling, and denormalized last message updates. |
| 5 | Recreate chat UI (drawer, list, message list, composer, unread badge) per 2.3. |
| 6 | Re-add sync script and npm scripts per 2.4. |
| 7 | Add or adjust migrations per 2.5; run and verify per 2.6. |

Use this prompt as the single source of truth for deleting the current chat implementation and recreating it with best practices.

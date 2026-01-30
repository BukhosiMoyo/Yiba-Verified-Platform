# Chat Drawer: Conversation List Not Showing New Chats – Debug Prompt

## Problem

- Messages **do** appear in the chat thread after the user searches and selects someone (new chat works).
- The conversation **does not** appear in the left-hand list (“people you have chat with before”) in the drawer.
- User sees “No messages yet / Start a conversation” in that list even after starting a chat.

## Likely Causes

1. **Race: initial fetch overwrites list after new chat is added**
   - Drawer opens → `fetchConversations()` starts.
   - User starts a new chat; `handleStartChat` adds the conversation (refetch + fallback `setConversations(prev => [asConv, ...prev])`).
   - The **initial** `fetchConversations()` then completes and does `setConversations(list)`.
   - If `list` does not yet include the new conversation (timing/cache), the new conversation is **overwritten** and disappears from the list.

2. **Periodic refresh overwrites list**
   - Every 15s the drawer runs `fetchConversations()` again.
   - Same as above: `setConversations(data.conversations || [])` can overwrite state and drop any conversation that isn’t in the API response (e.g. just added, or API/cache lag).

3. **Refetch after creating conversation doesn’t include new conversation**
   - In `handleStartChat` we refetch `GET /api/chat/conversations` and then `setConversations(list)`.
   - If the API returns without the new conversation (e.g. read-after-write lag), we replace the list with one that doesn’t have it; the fallback then does `setConversations(prev => [asConv, ...prev])` where `prev` is that list, so we do add it.
   - But any **later** call to `fetchConversations()` (e.g. from the 15s interval) will again overwrite with `list`; if the new conversation is still missing from the API, we drop it again.

## Fix

**Merge instead of replace when updating the conversation list from the API.**

In the drawer’s `fetchConversations`:

- After getting `data.conversations` from the API, do **not** do `setConversations(list)` only.
- Merge with current state so conversations that exist only in state (e.g. newly added) are kept:
  - `setConversations(prev => { const fromApi = data.conversations || []; const ids = new Set(fromApi.map(c => c.id)); const kept = prev.filter(c => !ids.has(c.id)); return [...kept, ...fromApi]; })`
- Optionally sort merged list (e.g. by `lastMessageAt` desc) so order is consistent.

Apply the same merge logic anywhere else that fetches the conversation list and updates state (e.g. full chat page if it has the same overwrite behaviour).

## Verification

- Open drawer → “No messages yet”.
- Start a conversation (search user, click) → chat opens with messages.
- Go back to list (back arrow) → the conversation you just opened appears in the list.
- Wait for 15s refresh (or close/reopen drawer) → the conversation is still in the list.

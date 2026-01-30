# View As User Feature — Move to User Profile Pages

## Overview

Move the "View As User" feature from the topbar dropdown to user profile/viewing pages. This provides better context and easier access when viewing a user's details.

## Current State

- **Location**: Topbar dropdown (`ViewAsUserSelector` component in `Topbar.tsx`)
- **Access**: Available to `PLATFORM_ADMIN`, `QCTO_SUPER_ADMIN`, `QCTO_ADMIN`, `INSTITUTION_ADMIN`
- **Functionality**: Dropdown lists all viewable users, selecting one starts viewing as that user

## Target State

- **Location**: User profile/viewing pages
- **Access**: Same roles, but button only appears when viewing a user they can view as
- **Functionality**: Single "View As User" button that directly links to the user's dashboard based on their role

## Implementation Plan

### Phase 1: Remove Topbar Integration

1. **Remove ViewAsUserSelector from Topbar**
   - File: `src/components/layout/Topbar.tsx`
   - Remove the import and component usage
   - Keep the ViewAsUserBanner (shown when actively viewing as another user)

### Phase 2: Add View As Button to User Profile Pages

#### 2.1 Platform Admin — User Detail Page

**File**: `src/app/platform-admin/users/[userId]/page.tsx`

- **Location**: Add button next to "Edit User" button in the header section (around line 230-240)
- **Button Text**: "View As User" or "View Dashboard As User"
- **Icon**: `Eye` from lucide-react
- **Visibility**: 
  - Only show if current user is `PLATFORM_ADMIN`
  - Only show if target user is not the current user
  - Only show if current user can view as target user (use `canViewAsUser` check)
- **Action**: 
  - Call `/api/view-as/start` with `targetUserId`
  - On success, redirect to appropriate dashboard based on target user's role:
    - `PLATFORM_ADMIN` → `/platform-admin`
    - `QCTO_*` roles → `/qcto`
    - `INSTITUTION_ADMIN`, `INSTITUTION_STAFF` → `/institution`
    - `STUDENT` → `/student`

#### 2.2 QCTO Admin — Team Member Detail Page

**Check if detail page exists**: `src/app/qcto/team/[userId]/page.tsx`

- **If exists**: Add "View As User" button similar to Platform Admin
- **If doesn't exist**: 
  - Create new page at `src/app/qcto/team/[userId]/page.tsx`
  - Display team member details (name, email, role, province assignments, etc.)
  - Add "View As User" button in header
  - Visibility: Only for `QCTO_SUPER_ADMIN` and `QCTO_ADMIN` viewing QCTO users they manage

**Alternative**: If no detail page, add button to team list page (`src/app/qcto/team/page.tsx`) in the actions column

#### 2.3 Institution Admin — Staff/Student Detail Pages

**Check if detail pages exist**:
- `src/app/institution/staff/[userId]/page.tsx`
- `src/app/institution/learners/[learnerId]/page.tsx` (for students)

- **If exists**: Add "View As User" button
- **If doesn't exist**:
  - Option A: Create detail pages
  - Option B: Add button to list pages (`src/app/institution/staff/page.tsx` and student list pages)
- **Visibility**: Only for `INSTITUTION_ADMIN` viewing their staff/students

### Phase 3: Create Helper Component

**File**: `src/components/shared/ViewAsUserButton.tsx`

Create a reusable button component:

```typescript
type ViewAsUserButtonProps = {
  targetUserId: string;
  targetUserRole: Role;
  currentUserRole: Role;
  currentUserId: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};
```

**Features**:
- Checks if current user can view as target user
- Shows loading state during API call
- Handles errors with toast notifications
- Redirects to appropriate dashboard after success
- Returns `null` if user cannot view as target

**Dashboard routing logic**:
```typescript
function getDashboardRoute(role: Role): string {
  if (role === "PLATFORM_ADMIN") return "/platform-admin";
  if (role.startsWith("QCTO_")) return "/qcto";
  if (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") return "/institution";
  if (role === "STUDENT") return "/student";
  return "/"; // fallback
}
```

### Phase 4: Update API Integration

**File**: `src/components/shared/ViewAsUserButton.tsx`

- Use existing `/api/view-as/start` endpoint
- Handle response and redirect
- Show success/error toasts

### Phase 5: Testing

1. **Platform Admin**:
   - View any user's profile page
   - Verify "View As User" button appears
   - Click button, verify redirect to correct dashboard
   - Verify ViewAsUserBanner appears in topbar

2. **QCTO Admin**:
   - View QCTO team member (if detail page exists)
   - Verify button appears for users they can view
   - Verify button doesn't appear for users they can't view
   - Test redirect to QCTO dashboard

3. **Institution Admin**:
   - View staff member or student
   - Verify button appears
   - Test redirect to institution/student dashboard

4. **Edge Cases**:
   - User viewing their own profile (button should not appear)
   - User without permission (button should not appear)
   - Network errors (show error toast)

## Files to Modify

1. `src/components/layout/Topbar.tsx` — Remove ViewAsUserSelector
2. `src/app/platform-admin/users/[userId]/page.tsx` — Add ViewAsUserButton
3. `src/app/qcto/team/[userId]/page.tsx` — Create if needed, add ViewAsUserButton
4. `src/app/qcto/team/page.tsx` — Add ViewAsUserButton to actions if no detail page
5. `src/app/institution/staff/[userId]/page.tsx` — Create if needed, add ViewAsUserButton
6. `src/app/institution/staff/page.tsx` — Add ViewAsUserButton to actions if no detail page
7. `src/app/institution/learners/[learnerId]/page.tsx` — Add ViewAsUserButton if exists
8. `src/components/shared/ViewAsUserButton.tsx` — **NEW** Create reusable component
9. `src/lib/viewAsUser.ts` — Verify `canViewAsUser` function exists and works correctly

## Files to Keep

- `src/components/shared/ViewAsUserBanner.tsx` — Keep for showing banner when viewing as user
- `src/lib/viewAsUserServer.ts` — Keep for server-side View As User info
- `src/app/api/view-as/*` — Keep all API routes

## Benefits

1. **Better UX**: More intuitive — viewing a user's profile naturally leads to viewing as them
2. **Contextual**: Button appears only when relevant (viewing a user you can view as)
3. **Direct Access**: No need to search through dropdown — direct link to user's dashboard
4. **Cleaner Topbar**: Less clutter in the topbar
5. **Easier Navigation**: Direct link to user ID makes it easier to bookmark/share

## Implementation Order

1. Create `ViewAsUserButton` component
2. Add to Platform Admin user detail page (test thoroughly)
3. Add to QCTO team pages (create detail page if needed)
4. Add to Institution staff/student pages
5. Remove ViewAsUserSelector from Topbar
6. Test all scenarios
7. Commit changes

## Notes

- Keep ViewAsUserBanner in topbar — it's still useful for showing when you're viewing as someone
- The "Stop Viewing As" functionality remains in the banner
- All existing API endpoints remain unchanged
- The feature works the same way, just accessed from a different location

# QCTO Invites Feature - Rebuild Prompt

## Overview
Build a complete QCTO Team Invites management system from scratch. This allows QCTO users with `QCTO_TEAM_MANAGE` capability to create, view, and manage invitations for new QCTO team members.

## Requirements

### 1. Database Schema (Already Exists)
- Model: `QCTOInvite` in Prisma schema
- Fields: id, qcto_id, email, full_name, role, token_hash, status, created_at, expires_at, accepted_at, invited_by_user_id
- Status enum: PENDING, ACCEPTED, EXPIRED, REVOKED
- Relations: qctoOrg, invitedBy (User)

### 2. API Routes

#### GET `/api/qcto/invites`
- **Purpose**: List all QCTO invites with filtering and pagination
- **Auth**: Requires `QCTO_TEAM_MANAGE` capability
- **Query Params**:
  - `status` (optional): Filter by status (PENDING, ACCEPTED, EXPIRED, REVOKED, or "all")
  - `limit` (optional, default: 50): Number of results per page
  - `offset` (optional, default: 0): Pagination offset
- **Response**:
  ```json
  {
    "items": [...],
    "total": 0,
    "limit": 50,
    "offset": 0
  }
  ```
- **Include**: `invitedBy` relation with user_id, first_name, last_name, email
- **Order**: Most recent first (created_at DESC)
- **Error Handling**: Return 403 for unauthorized, 500 for server errors

#### POST `/api/qcto/invites`
- **Purpose**: Create a new QCTO invite
- **Auth**: Requires `QCTO_TEAM_MANAGE` capability
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "QCTO_REVIEWER"
  }
  ```
- **Validation**:
  - Email: required, valid email format, normalized to lowercase
  - Full name: required, non-empty string
  - Role: must be one of QCTO_SUPER_ADMIN, QCTO_ADMIN, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER
- **Business Logic**:
  - Check if pending invite exists for email (same qcto_id) - return error if found
  - Generate secure random token (32 bytes hex)
  - Hash token with SHA-256 for storage
  - Set expiry to 7 days from now
  - Create invite with status PENDING
- **Response**:
  ```json
  {
    "success": true,
    "accept_url": "https://baseurl/auth/qcto/accept-invite?token=...",
    "message": "Invite created successfully"
  }
  ```
- **Error Handling**: Return 400 for validation errors, 403 for unauthorized, 500 for server errors

### 3. Frontend Page: `/qcto/invites`

#### Layout & Structure
- Use same layout pattern as `/qcto/team` page
- Padding: `p-4 md:p-8`
- Responsive spacing: `space-y-4 md:space-y-8`
- Page title: "QCTO Team Invites"
- Subtitle: "Manage invitations for QCTO team members"

#### Features

**1. Invite List Table**
- Display invites in a responsive table
- Columns: Email, Full Name, Role, Status, Invited By, Created, Expires
- Show loading state with `LoadingTable` component
- Show empty state with `EmptyState` component
- Support pagination (if needed in future)

**2. Status Filter**
- Dropdown filter with options: All Statuses, Pending, Accepted, Expired, Revoked
- Sync with URL query parameter `?status=PENDING`
- Update URL when filter changes
- Support navigation via sidebar links

**3. Create Invite Dialog**
- Button: "Invite Team Member" with Plus icon
- Form fields:
  - Full Name (required, text input)
  - Email (required, email input)
  - Role (required, select dropdown with QCTO roles)
- Form validation: Show errors for missing fields
- On success:
  - Show success message
  - Display accept URL in read-only input with copy button
  - Refresh invite list
  - Reset form
- On error: Show error toast with message

**4. Status Badges**
- PENDING: default variant (blue)
- ACCEPTED: secondary variant (gray)
- EXPIRED: outline variant
- REVOKED: destructive variant (red)

**5. Role Display**
- Format: Remove "QCTO_" prefix and replace underscores with spaces
- Example: "QCTO_REVIEWER" → "REVIEWER" → "Reviewer"

**6. Date Formatting**
- Format: "DD MMM YYYY, HH:MM" (en-ZA locale)
- Show "—" for null/undefined dates

**7. Error Handling**
- Handle 403 (forbidden) with dedicated error state
- Handle network errors gracefully
- Show retry button on error
- Display error messages in toast notifications

**8. State Management**
- Loading states for fetch and create operations
- Error states with user-friendly messages
- Form state management
- URL query parameter synchronization

### 4. Navigation Integration
- Add to QCTO navigation in `src/lib/navigation.ts`
- Label: "Invites"
- Icon: "mail"
- Capability: "QCTO_TEAM_MANAGE"
- Child links:
  - All: `/qcto/invites`
  - Pending: `/qcto/invites?status=PENDING`
  - Accepted: `/qcto/invites?status=ACCEPTED`
  - Expired: `/qcto/invites?status=EXPIRED`
  - Revoked: `/qcto/invites?status=REVOKED`

### 5. Code Quality Requirements
- Use TypeScript with proper types
- Follow existing code patterns (see `/qcto/team` page as reference)
- Use existing UI components from `@/components/ui`
- Use `toast` from "sonner" for notifications
- Handle errors consistently with existing patterns
- Add proper loading states
- Make responsive (mobile-friendly)
- Follow existing naming conventions

### 6. Testing Checklist
- [ ] Can view invites list when user has QCTO_TEAM_MANAGE capability
- [ ] Shows 403 error when user lacks capability
- [ ] Can filter invites by status
- [ ] Can create new invite with valid data
- [ ] Shows error when creating duplicate pending invite
- [ ] Displays accept URL after creating invite
- [ ] Can copy accept URL to clipboard
- [ ] Refreshes list after creating invite
- [ ] Shows proper loading states
- [ ] Handles network errors gracefully
- [ ] URL query parameters sync with filter state
- [ ] Navigation links work correctly

### 7. Implementation Order
1. Create API route: GET `/api/qcto/invites`
2. Create API route: POST `/api/qcto/invites`
3. Create frontend page: `/qcto/invites/page.tsx`
4. Add navigation item
5. Test all functionality
6. Fix any issues

### 8. Reference Files
- Team page: `src/app/qcto/team/page.tsx` (for layout and patterns)
- API context: `src/lib/api/context.ts` (for auth)
- Response utilities: `src/lib/api/response.ts` (for error handling)
- Navigation: `src/lib/navigation.ts` (for menu items)
- Prisma schema: `prisma/schema.prisma` (for data model)

## Notes
- The accept-invite functionality already exists at `/auth/qcto/accept-invite` - do not modify it
- The team page has its own invite creation - that's separate and should remain
- Use the same error handling patterns as the team page
- Ensure proper TypeScript types throughout
- Follow existing UI/UX patterns for consistency

# Platform Admin Dashboard Implementation

## Overview

Complete implementation of the Platform Admin dashboard for managing institutions, learners, and qualifications with full RBAC enforcement.

## What Was Implemented

### 1. API Routes

#### `/api/platform-admin/institutions` (GET)
- Lists all institutions (PLATFORM_ADMIN only)
- Supports search (`q`), pagination (`limit`, `offset`)
- Returns: `{ count, total, items }`

#### `/api/platform-admin/learners` (GET)
- Lists learners (PLATFORM_ADMIN only)
- Supports institution filter (`institution_id`), search (`q`), pagination
- Returns: `{ count, total, items }` with institution info

#### `/api/platform-admin/qualifications` (GET, POST)
- **GET**: Lists all qualifications (PLATFORM_ADMIN only)
- **POST**: Creates new qualification (PLATFORM_ADMIN only)
- Supports search (`q`), pagination
- Returns: `{ count, total, items }`

**RBAC Enforcement:**
- All routes check for `PLATFORM_ADMIN` role
- Returns `403 FORBIDDEN` if not authorized
- Uses shared `requireAuth()` resolver (supports dev token + NextAuth)

### 2. UI Pages

#### `/platform-admin/institutions`
- **Features:**
  - Table with legal name, trading name, province, registration number, status, created date
  - Search by name/registration number
  - Pagination (50 per page)
  - Row actions dropdown (View, Edit, Archive)
  - Empty state with icon
  - Loading skeleton
  - Error states

#### `/platform-admin/learners`
- **Features:**
  - Table with national ID, first name, last name, institution, created date
  - Institution filter dropdown (fetches from `/api/dev/institutions`)
  - Search by national ID, first name, last name
  - Pagination (50 per page)
  - Row actions dropdown (View, Edit, Archive)
  - Empty state with icon
  - Loading skeleton
  - Error states

#### `/platform-admin/qualifications`
- **Features:**
  - Table with name, code, created date, updated date
  - Search by name/code
  - "Add Qualification" dialog with form (name required, code optional)
  - Pagination (50 per page)
  - Empty state with icon
  - Loading skeleton
  - Error states
  - Toast notifications for create success/error

### 3. Navigation

Updated `/platform-admin/layout.tsx` to include:
- **Learners** (uses `users` icon - can be changed to `graduation-cap` if needed)
- **Qualifications** (uses `graduation-cap` icon)

### 4. UI Components Created

#### `src/components/ui/dialog.tsx`
- Full Dialog component using `@radix-ui/react-dialog`
- Exports: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`

#### `src/components/ui/select.tsx`
- Simple Select component using native `<select>` with styled wrapper
- API-compatible with shadcn/ui Select pattern
- **Note**: For full-featured select with search, install `@radix-ui/react-select` and replace this

#### `src/components/ui/dropdown-menu.tsx`
- Full DropdownMenu component using `@radix-ui/react-dropdown-menu`
- **Note**: Requires `@radix-ui/react-dropdown-menu` package (see setup below)

## Required Packages

The following packages need to be installed:

```bash
npm install @radix-ui/react-dropdown-menu
```

**Optional** (for enhanced Select component):
```bash
npm install @radix-ui/react-select
```

## Setup Instructions

### 1. Install Missing Packages

```bash
cd yiba-verified
npm install @radix-ui/react-dropdown-menu
```

### 2. Start Development Server

```bash
npm run dev
```

Server should run on `http://localhost:3000` (or `3001` if 3000 is taken).

### 3. Authentication

**Option A: Dev Token (Development Only)**

Get your dev token from `.env`:
```bash
export DEV_API_TOKEN=$(grep -E '^DEV_API_TOKEN=' .env | sed -E 's/^DEV_API_TOKEN="?(.*)"?$/\1/')
```

**Option B: NextAuth Session**

Login via the web UI at `/auth/login` (requires a PLATFORM_ADMIN user).

## Testing

### Test API Routes (Dev Token)

#### 1. List Institutions

```bash
export BASE_URL="http://localhost:3000"
export DEV_API_TOKEN="<your-dev-token>"

curl -sS "$BASE_URL/api/platform-admin/institutions" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

With search:
```bash
curl -sS "$BASE_URL/api/platform-admin/institutions?q=tech" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

#### 2. List Learners

```bash
# All learners
curl -sS "$BASE_URL/api/platform-admin/learners" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq

# Filter by institution
INSTITUTION_ID=$(curl -sS "$BASE_URL/api/platform-admin/institutions" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].institution_id')

curl -sS "$BASE_URL/api/platform-admin/learners?institution_id=$INSTITUTION_ID" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq

# Search
curl -sS "$BASE_URL/api/platform-admin/learners?q=900101" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

#### 3. List Qualifications

```bash
curl -sS "$BASE_URL/api/platform-admin/qualifications" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
```

#### 4. Create Qualification

```bash
curl -X POST "$BASE_URL/api/platform-admin/qualifications" \
  -H "Content-Type: application/json" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
  -d '{
    "name": "Diploma in Information Technology",
    "code": "DIT001"
  }' | jq
```

### Test UI Pages

1. **Navigate to Platform Admin Dashboard:**
   - Go to `http://localhost:3000/platform-admin`
   - Ensure you're logged in as PLATFORM_ADMIN

2. **Test Institutions Page:**
   - Click "Institutions" in sidebar
   - Verify table loads with data
   - Test search functionality
   - Test pagination (if > 50 institutions)
   - Test row actions dropdown

3. **Test Learners Page:**
   - Click "Learners" in sidebar
   - Verify table loads
   - Test institution filter dropdown
   - Test search functionality
   - Test pagination

4. **Test Qualifications Page:**
   - Click "Qualifications" in sidebar
   - Verify table loads
   - Click "Add Qualification" button
   - Fill in form (name required, code optional)
   - Submit and verify success toast
   - Verify new qualification appears in table

### Verify RBAC

**Test 1: Non-PLATFORM_ADMIN Access (Should Fail)**

Try accessing API as non-admin (should return 403):
```bash
# This should fail if your token is not PLATFORM_ADMIN
curl -sS "$BASE_URL/api/platform-admin/institutions" \
  -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
# Expected: { "error": "Only PLATFORM_ADMIN can access this endpoint", "code": "FORBIDDEN" }
```

**Test 2: Missing Auth (Should Fail)**

```bash
curl -sS "$BASE_URL/api/platform-admin/institutions" | jq
# Expected: { "error": "Unauthorized", "code": "UNAUTHENTICATED" }
```

## UI Features

### Responsive Design
- **Mobile**: Tables scroll horizontally, filters stack vertically
- **Tablet/Desktop**: Full table layout with side-by-side filters

### Loading States
- Skeleton loaders while data fetches
- Disabled buttons during submissions

### Error Handling
- Friendly error messages in red alert boxes
- Toast notifications for success/error actions

### Empty States
- Descriptive messages with icons
- Helpful guidance on what to do next

### Pagination
- Shows "Showing X to Y of Z"
- Previous/Next buttons (disabled when at start/end)

## File Structure

```
yiba-verified/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── platform-admin/
│   │   │       ├── institutions/
│   │   │       │   └── route.ts          # GET /api/platform-admin/institutions
│   │   │       ├── learners/
│   │   │       │   └── route.ts          # GET /api/platform-admin/learners
│   │   │       └── qualifications/
│   │   │           └── route.ts          # GET, POST /api/platform-admin/qualifications
│   │   └── platform-admin/
│   │       ├── layout.tsx                # Updated navigation
│   │       ├── institutions/
│   │       │   └── page.tsx              # Institutions list UI
│   │       ├── learners/
│   │       │   └── page.tsx              # Learners list UI
│   │       └── qualifications/
│   │           └── page.tsx              # Qualifications list UI
│   └── components/
│       └── ui/
│           ├── dialog.tsx                # NEW: Dialog component
│           ├── select.tsx                # NEW: Select component (simple)
│           └── dropdown-menu.tsx         # NEW: DropdownMenu component
```

## Next Steps

### Recommended Enhancements

1. **Detail Pages:**
   - `/platform-admin/institutions/[id]` - View/edit institution details
   - `/platform-admin/learners/[id]` - View/edit learner details

2. **Edit/Archive Functionality:**
   - Implement edit dialogs/forms
   - Implement archive (soft delete) with confirmation

3. **Enhanced Filters:**
   - Status filters for institutions
   - Date range filters
   - Advanced search options

4. **Bulk Actions:**
   - Bulk archive/export
   - CSV export per page

5. **Performance:**
   - Add data caching (React Query/SWR)
   - Implement optimistic updates
   - Add infinite scroll option

## Troubleshooting

### Issue: Dropdown menu not working
**Solution:** Install `@radix-ui/react-dropdown-menu`:
```bash
npm install @radix-ui/react-dropdown-menu
```

### Issue: Select dropdown looks basic
**Solution:** Install full Select component:
```bash
npm install @radix-ui/react-select
```
Then replace `src/components/ui/select.tsx` with a full shadcn/ui Select implementation.

### Issue: API returns 401/403
**Check:**
1. Dev token is set correctly in `.env`
2. `X-DEV-TOKEN` header is included in request
3. User role is `PLATFORM_ADMIN` (for dev token, this is set in `requireDevToken()`)

### Issue: Navigation items not showing
**Check:**
1. User is logged in as `PLATFORM_ADMIN`
2. Layout is rendering correctly (check browser console)
3. Icons are mapped in `Sidebar.tsx`

## Summary

✅ **Complete Implementation:**
- 3 API routes with RBAC enforcement
- 3 UI pages with search, filters, pagination
- Responsive design with loading/error/empty states
- Navigation integration
- Dialog and Select components

✅ **RBAC Compliance:**
- All API routes enforce `PLATFORM_ADMIN` role
- Clear error messages for unauthorized access
- Dev token auth works for development testing

✅ **Ready for Testing:**
- Follow setup instructions above
- Use curl commands to test APIs
- Navigate to UI pages and test functionality

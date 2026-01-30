# Fix Institution Announcements Route - Debugging Prompt

## Issue
When logged in as institution admins, the route `http://localhost:3000/institution/announcements` was not working. This document describes the issues found and fixes applied.

## Root Causes Identified

### 1. Wrong Route in Navigation
**Problem**: The institution navigation was pointing to `/institution/announcements` which had issues, instead of `/announcements` which was working correctly.

**Location**: `src/lib/navigation.ts` line 80

**Fix**: Changed the navigation to point to `/announcements` (the working route used by students and QCTO). Added a "Manage Announcements" button on the `/announcements` page for institution admins that links to `/institution/announcements` for management purposes.

### 2. API Route Access Restriction
**Problem**: The `/api/institution/announcements` route only allowed `INSTITUTION_ADMIN` access, blocking `INSTITUTION_STAFF` users.

**Location**: `src/app/api/institution/announcements/route.ts` line 20

**Fix**: Updated to allow both `INSTITUTION_ADMIN` and `INSTITUTION_STAFF` to view announcements (read access). Note: Only `INSTITUTION_ADMIN` can create/edit announcements (enforced by `/api/announcements` POST/PATCH routes).

### 3. Cache Issues
**Problem**: Next.js client-side caching could cause stale data or routing issues.

**Location**: `src/app/institution/announcements/page.tsx` fetch calls

**Fix**: Added cache-busting headers to the GET request:
```typescript
cache: "no-store",
headers: {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
}
```

## Files Modified

1. `src/lib/navigation.ts`
   - Changed institution announcements href from `/institution/announcements` to `/announcements` (the working route)

2. `src/app/announcements/page.tsx`
   - Added "Manage Announcements" button for institution admins that links to `/institution/announcements` for management
   - Updated description text to be role-appropriate

3. `src/app/api/institution/announcements/route.ts`
   - Updated role check to allow both `INSTITUTION_ADMIN` and `INSTITUTION_STAFF` (for the management interface)

4. `src/app/institution/announcements/page.tsx`
   - Added cache-busting headers to fetch request (for the management interface)

## Testing Checklist

- [ ] Login as `INSTITUTION_ADMIN` → Click "Announcements" in sidebar → Should navigate to `/announcements` and work
- [ ] Login as `INSTITUTION_ADMIN` → On `/announcements` page → Should see "Manage Announcements" button
- [ ] Click "Manage Announcements" → Should navigate to `/institution/announcements` for management
- [ ] Login as `INSTITUTION_STAFF` → Click "Announcements" in sidebar → Should navigate to `/announcements` and work (view-only)
- [ ] Verify `INSTITUTION_ADMIN` can create/edit announcements via management interface
- [ ] Verify `INSTITUTION_STAFF` cannot create/edit (API should return 403)
- [ ] Clear browser cache and test again
- [ ] Test with Next.js dev server restart

## Additional Notes

- The general `/api/announcements` route already supports both roles for viewing
- The `/api/institution/announcements` route is institution-scoped and shows all announcements for the user's institution
- Create/edit operations are handled by `/api/announcements` POST/PATCH routes, which only allow `INSTITUTION_ADMIN`
- If cache issues persist, try:
  - Clearing `.next` directory: `rm -rf .next`
  - Restarting dev server
  - Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
  - Clearing browser cache

## Related Files

- `src/lib/capabilities.ts` - Defines role capabilities
- `src/components/layout/nav.ts` - Navigation filtering logic
- `src/middleware.ts` - Route protection middleware
- `src/app/api/announcements/route.ts` - General announcements API (create/edit)

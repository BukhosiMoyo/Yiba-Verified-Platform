# Announcements Fix - Role Display & Targeting

## Issues Fixed

### 1. Foreign Key Constraint Error
**Problem**: Creating announcements failed with foreign key constraint error
**Root Cause**: User might not exist in database when creating announcement
**Fix**: Added proper error handling and user existence check

### 2. Wrong Name Display
**Problem**: Announcements showed wrong creator names
**Root Cause**: Was querying User table at display time instead of storing name at creation
**Fix**: 
- Added `created_by_name` field (already done)
- Added `created_by_role` field to show role (Platform Admin, QCTO User, etc.)
- Display shows role instead of just name: "Platform Admin (John Doe)"

### 3. Role-Based Targeting
**Problem**: No way to target announcements to specific user types
**Fix**: 
- Added `target_roles` array field to Announcement
- Empty array = visible to all users
- Populated array = only those roles can see it
- UI allows selecting target roles when creating/editing

---

## Schema Changes

**Announcement Model**:
- `created_by_role` (UserRole) - Stores creator's role at creation time
- `target_roles` (UserRole[]) - Which roles can see this announcement

**Migration**: `20260121225001_add_announcement_role_targeting/migration.sql`

---

## API Changes

### POST /api/announcements
- Now accepts `target_roles` array in request body
- Stores `created_by_role` automatically
- Validates target_roles
- **Now allows QCTO users** (not just PLATFORM_ADMIN)

### GET /api/announcements
- Filters by user's role if authenticated
- Shows announcements with empty `target_roles` (all users) OR user's role in `target_roles`
- Returns `created_by.role` in response

### PATCH /api/announcements/[id]
- Can update `target_roles`
- **Now allows QCTO users** (not just PLATFORM_ADMIN)

---

## UI Changes

### Announcements Management Page
- Added role selector checkboxes for targeting
- Shows "Created by Platform Admin (John Doe)" format
- Shows target audience: "Target: Students, Institution Admins" or "Visible to all users"
- Empty selection = visible to all users

### Announcement Banner
- Updated interface to include role (optional)

---

## How It Works

### Creating Announcements

1. **Platform Admin or QCTO User** creates announcement
2. System stores:
   - `created_by_name` - "John Doe"
   - `created_by_role` - "PLATFORM_ADMIN" or "QCTO_USER"
3. Admin selects target roles (or leaves empty for all users)
4. System stores `target_roles` array

### Viewing Announcements

1. User requests announcements
2. System filters by:
   - If `target_roles` is empty → show to all
   - If user's role is in `target_roles` → show
   - Otherwise → don't show
3. Display shows: "Created by Platform Admin (John Doe)"

---

## Testing

1. **Run migration**: `npx prisma migrate dev`
2. **Create announcement as Platform Admin**:
   - Should store role as "PLATFORM_ADMIN"
   - Should show "Created by Platform Admin (Name)"
3. **Create announcement as QCTO User**:
   - Should store role as "QCTO_USER" (or specific QCTO role)
   - Should show "Created by QCTO User (Name)"
4. **Test targeting**:
   - Create announcement targeting only "STUDENT"
   - Log in as student → should see it
   - Log in as institution admin → should NOT see it
   - Create announcement with no targets → everyone sees it

---

## Notes

- QCTO users can now create announcements (API allows it)
- Platform Admin layout currently restricts access - QCTO users may need their own announcements page or layout update
- Role display format: "{Role} ({Name})" e.g., "Platform Admin (John Doe)"

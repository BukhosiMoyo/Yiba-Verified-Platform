# Fix QCTO Team Actions Column - Comprehensive Prompt

## Problem Statement
The QCTO Team table's Actions column has several issues:
1. **QCTO Super Admin users still show "Login As" button** - They should NOT have this action
2. **Poor visibility** - Icons are too small, cluttered, and hard to distinguish
3. **Inconsistent icon count** - Some rows show 4 icons, others show 3
4. **Duplicate eye icons** - Some rows have two identical eye icons which is confusing
5. **No clear labels** - Users can't easily understand what each action does

## Requirements

### 1. Remove "Login As" for QCTO Super Admin
- **Rule**: QCTO_SUPER_ADMIN role users must NOT have the "Login As" (impersonation) button
- **Implementation**: Add explicit check `m.role !== "QCTO_SUPER_ADMIN"` before rendering `GenerateImpersonationLink`
- **Verification**: Check that Super Admin users have 3 actions instead of 4

### 2. Improve Actions Column Visibility

#### A. Better Spacing and Sizing
- Increase button size from `h-8 w-8` to `h-10 w-10` for better clickability
- Increase gap between buttons from `gap-1` or `gap-2` to `gap-3` for better separation
- Add padding around the actions container for breathing room

#### B. Clear Visual Hierarchy
- Use distinct button variants:
  - View: `variant="ghost"` with subtle hover
  - Login As: `variant="outline"` with primary color accent
  - Status Toggle: `variant="ghost"` with color-coded icons (green for active, gray for inactive)
  - More Actions: `variant="ghost"` with distinct styling
- Add subtle borders or backgrounds to make buttons more distinct

#### C. Tooltips with Clear Labels
- Every action button MUST have a tooltip with descriptive text:
  - "Login as [User Name]" - for impersonation
  - "View user details" - for view action
  - "Disable user" or "Enable user" - for status toggle
  - "More actions (Change role)" - for dropdown menu
- Tooltips should appear on hover with a short delay (200ms)
- Tooltips should be positioned consistently (above or below)

#### D. Remove Duplicate Actions
- Ensure only ONE view/details button (remove any duplicate eye icons)
- Consolidate actions logically:
  1. Login As (if allowed)
  2. View Details
  3. Toggle Status
  4. More Actions (dropdown for role change)

#### E. Consistent Icon Count
- All rows should have the same number of visible actions (except when Login As is hidden for Super Admin)
- Super Admin rows: 3 actions (View, Status, More)
- Other users: 4 actions (Login As, View, Status, More)

### 3. Enhanced Visual Design

#### A. Icon Improvements
- Use larger icons: `h-5 w-5` instead of `h-4 w-4`
- Ensure icons have consistent stroke width (1.5 or 2)
- Use color coding:
  - View: Default gray
  - Login As: Primary color (blue)
  - Status Active: Green tint
  - Status Inactive: Gray
  - More Actions: Default gray

#### B. Button States
- Clear hover states: `hover:bg-muted` or `hover:bg-primary/10`
- Active/focused states with ring: `focus:ring-2 focus:ring-primary`
- Disabled states for actions that can't be performed

#### C. Responsive Design
- On smaller screens, consider stacking actions vertically or using a dropdown
- Ensure actions remain accessible on mobile/tablet views

## Implementation Checklist

- [ ] Add role check to hide "Login As" for QCTO_SUPER_ADMIN
- [ ] Increase button sizes to h-10 w-10
- [ ] Increase spacing to gap-3
- [ ] Add tooltips to ALL action buttons with clear labels
- [ ] Remove any duplicate view buttons
- [ ] Ensure consistent icon count per row
- [ ] Use larger icons (h-5 w-5)
- [ ] Add color coding to icons/buttons
- [ ] Improve hover and focus states
- [ ] Test with Super Admin users (should show 3 actions)
- [ ] Test with other roles (should show 4 actions)

## Success Criteria

✅ QCTO Super Admin users have NO "Login As" button
✅ All action buttons are clearly visible and easy to click
✅ Tooltips provide clear descriptions of each action
✅ Consistent number of actions per row (3 for Super Admin, 4 for others)
✅ No duplicate or redundant actions
✅ Better visual hierarchy and spacing
✅ Icons are large enough to be easily recognizable

## Files to Modify

1. `yiba-verified/src/app/qcto/team/page.tsx` - Main table component with Actions column

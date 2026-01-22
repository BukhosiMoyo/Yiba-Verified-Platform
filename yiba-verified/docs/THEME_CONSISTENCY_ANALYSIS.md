# Theme Consistency Analysis & Implementation Plan

## Problem Statement

Visual inconsistencies appear at night when macOS automatically switches system appearance, causing some UI sections to look "off" (slightly grey, darker than expected, inconsistent) while other sections remain correct.

## Root Cause Analysis

### 1. Theme Provider Configuration
- **Location**: `src/app/providers.tsx`
- **Current Setup**: 
  - Uses `next-themes` with `defaultTheme="system"`
  - `enableSystem` is true
  - This means the app **follows macOS system appearance changes**
- **Impact**: When macOS switches between light/dark mode based on time of day, the app theme switches automatically

### 2. CSS Variable System (✅ Well-Designed)
- **Location**: `src/app/globals.css`
- **Status**: Properly defined
  - `:root` defines light mode variables
  - `.dark` defines dark mode variables
  - Theme tokens are correctly mapped to Tailwind colors
- **Available Tokens**:
  - `background`, `foreground`
  - `card`, `card-foreground`
  - `muted`, `muted-foreground`
  - `border`, `input`, `accent`
  - `border-subtle`, `border-strong`

### 3. The Actual Problem: Inconsistent Color Usage

**Many components use hardcoded colors instead of theme tokens:**

#### Examples Found:
1. **Hardcoded `bg-white`** (doesn't respect dark mode):
   - `src/app/student/page.tsx`: `bg-white` (lines 65, 89, 165)
   - `src/app/qcto/QctoDashboardClient.tsx`: `bg-white` (lines 166, 240, 306)
   - `src/components/shared/GlobalSearch.tsx`: `bg-white` (line 314)
   - Many more...

2. **Hardcoded `text-gray-*`** (doesn't respect dark mode):
   - `src/app/student/page.tsx`: `text-gray-600` (lines 110, 113, 116, 119, 122)
   - `src/app/qcto/submissions/[submissionId]/page.tsx`: `text-gray-900` (line 178)
   - `src/components/student/StudentProfileClient.tsx`: `text-gray-900 dark:text-gray-100` (inconsistent pattern)

3. **Hardcoded `border-gray-*`** (doesn't respect dark mode):
   - `src/app/student/page.tsx`: `border-gray-200/60` (lines 65, 89, 165)
   - `src/app/qcto/QctoDashboardClient.tsx`: `border-gray-200/60` (lines 166, 240, 306)

4. **Inconsistent Dark Mode Patterns**:
   - Some components use `dark:bg-gray-900/50` instead of `bg-card`
   - Some use `dark:text-gray-100` instead of `text-foreground`
   - Some use `dark:border-gray-700/60` instead of `border-border`

### 4. Why This Causes Night-Time Issues

When macOS switches to dark mode at night:
1. The theme provider switches the app to dark mode
2. Components using **theme tokens** (like `bg-background`, `bg-card`) switch correctly
3. Components using **hardcoded colors** (like `bg-white`, `text-gray-900`) **do not switch**
4. This creates a visual mismatch where:
   - Some sections are dark (using theme tokens)
   - Some sections remain light (using hardcoded colors)
   - The result: sections appear "grey", "washed out", or "darker than expected"

## Solution Strategy

### Phase 1: Audit & Document
- ✅ Identify all hardcoded color usages
- ✅ Document which components need updates
- ✅ Create this analysis document

### Phase 2: Systematic Replacement
Replace hardcoded colors with theme tokens:

| Hardcoded Color | Theme Token Replacement |
|----------------|------------------------|
| `bg-white` | `bg-card` or `bg-background` |
| `text-gray-900` | `text-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-700` | `text-foreground` or `text-muted-foreground` |
| `border-gray-200` | `border-border` |
| `bg-gray-50` | `bg-muted` |
| `dark:bg-gray-900/50` | `bg-card` (already theme-aware) |
| `dark:text-gray-100` | `text-foreground` (already theme-aware) |
| `dark:border-gray-700/60` | `border-border` (already theme-aware) |

### Phase 3: Component-by-Component Fixes
1. Start with high-visibility components (pages, layouts)
2. Fix shared components (ui components, shared components)
3. Fix feature-specific components
4. Test each fix in both light and dark modes

### Phase 4: Verification
- Test with system theme switching enabled
- Test with explicit light/dark mode
- Verify no visual regressions
- Ensure consistency across all pages

## Implementation Plan

### Priority 1: Core Layout & High-Visibility Components ✅ COMPLETED
1. ✅ `src/app/student/page.tsx` - Student dashboard
2. ✅ `src/app/qcto/QctoDashboardClient.tsx` - QCTO dashboard
3. ✅ `src/components/shared/GlobalSearch.tsx` - Global search modal
4. ✅ `src/components/layout/AppShell.tsx` - Main app shell (already uses tokens ✅)

### Priority 2: UI Components
1. `src/components/ui/date-picker.tsx` - Date picker
2. `src/components/ui/radio-group.tsx` - Radio buttons
3. Other UI components as needed

### Priority 3: Feature Components
1. `src/components/student/StudentProfileClient.tsx` - Student profile
2. `src/app/qcto/submissions/[submissionId]/page.tsx` - Submission details
3. Other feature-specific components

### Priority 4: Tables & Data Display
1. Tables with hardcoded colors
2. Data display components
3. Export/print views

## Testing Strategy

1. **Manual Testing**:
   - Switch between light/dark mode manually
   - Let macOS auto-switch at night
   - Check all major pages in both modes

2. **Visual Regression**:
   - Compare before/after screenshots
   - Ensure no unintended color changes

3. **Consistency Check**:
   - All backgrounds should use `bg-background` or `bg-card`
   - All text should use `text-foreground` or `text-muted-foreground`
   - All borders should use `border-border`

## Success Criteria

✅ Light mode looks identical regardless of time of day  
✅ Dark mode looks identical regardless of time of day  
✅ No sections appear unintentionally grey or washed out  
✅ All components respect theme switching  
✅ Visual consistency across all pages  
✅ No regressions in existing functionality

## Notes

- The theme system is **already well-designed** - we just need to use it consistently
- No need to change theme provider configuration (system theme is fine)
- No need to redesign UI - just replace hardcoded colors with tokens
- This is a **refactoring task**, not a redesign task

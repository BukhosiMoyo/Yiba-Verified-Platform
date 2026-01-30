# Disable OS Theme Sync - Implementation Prompt

## Problem Statement

The application theme is currently reacting to operating system theme changes (e.g., macOS switching between Light and Dark Mode). This causes:
- Unexpected UI changes while working
- Visual inconsistencies during editing
- Difficulty designing and validating layouts reliably

## Current Implementation Analysis

### Theme Provider Configuration (`src/app/providers.tsx`)
```tsx
<ThemeProvider 
  attribute="class" 
  defaultTheme="system"    // ← Problem: Follows OS preference
  enableSystem              // ← Problem: Enables OS sync
  storageKey="yiba-theme" 
  disableTransitionOnChange
>
```

### Theme Toggle Component (`src/components/shared/ThemeToggle.tsx`)
- Already correctly toggles between explicit `"light"` and `"dark"` values
- Uses `resolvedTheme` for display purposes only
- No changes required

## Required Changes

### 1. Modify ThemeProvider Configuration

**File:** `src/app/providers.tsx`

**Before:**
```tsx
<ThemeProvider 
  attribute="class" 
  defaultTheme="system" 
  enableSystem 
  storageKey="yiba-theme" 
  disableTransitionOnChange
>
```

**After:**
```tsx
<ThemeProvider 
  attribute="class" 
  defaultTheme="light" 
  enableSystem={false}
  storageKey="yiba-theme" 
  disableTransitionOnChange
>
```

### Key Changes Explained

| Property | Before | After | Reason |
|----------|--------|-------|--------|
| `defaultTheme` | `"system"` | `"light"` | New users get light mode, not OS preference |
| `enableSystem` | `true` (implicit) | `false` (explicit) | Completely disables OS theme detection |

### 2. No Changes Needed

The following components already work correctly:

- **ThemeToggle.tsx**: Already toggles explicitly between `"light"` and `"dark"`
- **globals.css**: CSS variables for both themes are properly defined
- **Tailwind dark mode**: Class-based system works as expected
- **localStorage**: `next-themes` persists the user's explicit choice

## Behavior After Implementation

### Theme Initialization (App Load)
1. Check localStorage for saved preference (`yiba-theme`)
2. If found → Apply saved theme (`"light"` or `"dark"`)
3. If not found → Default to `"light"` mode
4. OS `prefers-color-scheme` is completely ignored

### Theme Toggle (User Action)
1. User clicks theme toggle button
2. Theme switches to opposite (`light` ↔ `dark`)
3. New preference saved to localStorage
4. Theme persists across browser sessions
5. No reference to OS theme at any point

### What Changes for Users

| Scenario | Before | After |
|----------|--------|-------|
| First visit, no preference | Follows OS theme | Light mode |
| OS switches to dark mode | UI switches to dark | No change |
| OS switches to light mode | UI switches to light | No change |
| User manually toggles | Works correctly | Works correctly |
| Return visit with saved pref | Respects saved pref | Respects saved pref |

## Validation Checklist

After implementation, verify:

- [ ] New browser session defaults to light mode
- [ ] Changing OS theme does not affect app
- [ ] Manual toggle works correctly
- [ ] Theme persists after page refresh
- [ ] Theme persists after browser restart
- [ ] All pages respect the chosen theme
- [ ] No hydration warnings in console

## Non-Goals (Explicitly Not Implemented)

- ❌ Automatic dark mode at night
- ❌ Automatic light mode during the day
- ❌ OS-driven theme switching
- ❌ Hybrid behavior (user + system)
- ❌ "System" as a theme option in the UI

## Outcome

After this change:
- UI theme is predictable and stable
- Design process is reliable
- Users have full control over their preferred theme
- Application behaves like a professional SaaS product

# Light/Dark Mode Audit Prompt

## Objective

Perform a comprehensive audit of all user dashboards and UI components to identify and fix light mode and dark mode theming issues. This includes checking borders, text, backgrounds, buttons, pills/badges, and all color implementations.

---

## Project Context

### Theme Implementation
- **Theme Provider**: `next-themes` in `src/app/providers.tsx`
- **CSS Variables**: Defined in `src/app/globals.css` using Tailwind v4 `@theme inline`
- **Mode Toggle**: Class-based (`.dark` class on HTML element)
- **Default**: System preference with `yiba-theme` storage key

### Theme Tokens (CSS Variables)
```css
/* Base Colors */
--background, --foreground
--card, --card-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--border, --input

/* Semantic Colors */
--color-primary (#2563eb)
--color-destructive (#dc2626)

/* Border Variants */
--border-subtle, --border-strong

/* Shadows */
--shadow-soft, --shadow-card, --shadow-float

/* Gradients */
--bg-gradient-hero-start/mid/end
--bg-gradient-panel-start/end
--bg-gradient-cta-start/end
```

---

## Dashboards to Audit

### 1. Institution Dashboard
- `src/app/institution/layout.tsx`
- `src/app/institution/page.tsx`
- `src/components/institution/InstitutionDashboardClient.tsx`
- Related pages: readiness, learners, enrolments, staff, requests, submissions, documents, announcements

### 2. QCTO Dashboard
- `src/app/qcto/layout.tsx`
- `src/app/qcto/page.tsx`
- `src/components/qcto/QctoDashboardClient.tsx`
- Related pages: readiness, institutions, learners, enrolments, facilitators, requests, submissions, team, evidence-flags, audit-logs

### 3. Platform Admin Dashboard
- `src/app/platform-admin/layout.tsx`
- `src/app/platform-admin/page.tsx`
- `src/components/platform-admin/PlatformAdminDashboardClient.tsx`
- Related pages: users, institutions, learners, invites, announcements, audit-logs, system-health, qualifications, reports

### 4. Student Dashboard
- `src/app/student/layout.tsx`
- `src/app/student/page.tsx`

### 5. Account Pages
- `src/app/account/layout.tsx`
- All account subpages (profile, logs, etc.)

### 6. Shared Layout Components
- `src/components/layout/AppShell.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Topbar.tsx`

---

## UI Components to Audit

All components in `src/components/ui/`:

| Component | File | Priority |
|-----------|------|----------|
| Button | `button.tsx` | HIGH |
| Badge | `badge.tsx` | HIGH |
| Card | `card.tsx` | HIGH |
| Input | `input.tsx` | HIGH |
| Select | `select.tsx` | HIGH (known issues) |
| Health Status Pill | `health-status-pill.tsx` | HIGH (known issues) |
| Table | `table.tsx` | HIGH |
| Dialog | `dialog.tsx` | MEDIUM |
| Sheet | `sheet.tsx` | MEDIUM |
| Dropdown Menu | `dropdown-menu.tsx` | MEDIUM |
| Tabs | `tabs.tsx` | MEDIUM |
| Alert | `alert.tsx` | MEDIUM |
| Checkbox | `checkbox.tsx` | MEDIUM |
| Radio Group | `radio-group.tsx` | MEDIUM |
| Switch | `switch.tsx` | MEDIUM |
| Skeleton | `skeleton.tsx` | MEDIUM |
| Progress | `progress.tsx` | MEDIUM |
| Tooltip | `tooltip.tsx` | LOW |
| Separator | `separator.tsx` | LOW |
| Scroll Area | `scroll-area.tsx` | LOW |
| Slider | `slider.tsx` | LOW |
| Calendar | `calendar.tsx` | MEDIUM |
| Date Picker | `date-picker.tsx`, `date-picker-v2.tsx` | MEDIUM |
| Multi Select | `multi-select.tsx` | MEDIUM |
| Popover | `popover.tsx` | MEDIUM |
| Form | `form.tsx` | MEDIUM |
| Label | `label.tsx` | LOW |
| Textarea | `textarea.tsx` | MEDIUM |
| Rich Text Editor | `rich-text-editor.tsx` | MEDIUM |
| Alert Dialog | `alert-dialog.tsx` | MEDIUM |
| Sonner (Toast) | `sonner.tsx` | MEDIUM |

### Shared Components
- `src/components/shared/Backgrounds.tsx`
- `src/components/shared/GlobalSearch.tsx`
- `src/components/shared/ThemeToggle.tsx`
- `src/components/shared/ViewAsUserBanner.tsx`

---

## Audit Checklist

### For Each Component/Page, Check:

#### 1. Text Colors
- [ ] Primary text uses `text-foreground` (not hardcoded `text-gray-900`, `text-black`, etc.)
- [ ] Muted text uses `text-muted-foreground` (not `text-gray-500`, `text-gray-600`)
- [ ] Link text has proper dark mode variants
- [ ] Heading colors adapt properly
- [ ] Labels and captions are readable in both modes

#### 2. Background Colors
- [ ] Main backgrounds use `bg-background` (not `bg-white`, `bg-gray-50`)
- [ ] Card backgrounds use `bg-card` (not `bg-white`)
- [ ] Muted backgrounds use `bg-muted` (not `bg-gray-100`, `bg-gray-50`)
- [ ] Accent backgrounds use `bg-accent` with proper dark variants
- [ ] No hardcoded white/black backgrounds without dark mode override

#### 3. Border Colors
- [ ] Standard borders use `border-border` (not `border-gray-200`, `border-gray-300`)
- [ ] Subtle borders use `border-border-subtle` or appropriate opacity
- [ ] Focus borders use theme-aware colors
- [ ] Dividers/separators use theme tokens
- [ ] Table borders adapt properly

#### 4. Buttons
- [ ] All button variants have dark mode styles
- [ ] Hover states work in both modes
- [ ] Disabled states are visible in both modes
- [ ] Focus rings are visible in both modes
- [ ] Icon buttons have proper contrast

#### 5. Pills/Badges
- [ ] Status badges (success, warning, error, info) work in both modes
- [ ] Badge text is readable against badge background in both modes
- [ ] Opacity-based colors have sufficient contrast
- [ ] Outline badges have visible borders in both modes

#### 6. Form Elements
- [ ] Input fields have proper background and border colors
- [ ] Placeholder text is readable in both modes
- [ ] Select dropdowns work in both modes
- [ ] Checkboxes and radio buttons are visible in both modes
- [ ] Switch toggles have proper contrast
- [ ] Form validation states (error red, success green) work in both modes

#### 7. Tables
- [ ] Table headers have proper background
- [ ] Row hover states work in both modes
- [ ] Alternating row colors (if any) work in both modes
- [ ] Table borders are visible in both modes

#### 8. Shadows & Effects
- [ ] Box shadows are visible in light mode
- [ ] Shadows are subtle/removed in dark mode (prevent glow effect)
- [ ] Ring effects have proper colors

#### 9. Icons
- [ ] Icon colors adapt to theme
- [ ] SVG fills/strokes use currentColor or theme variables

#### 10. Status Colors
- [ ] Success (green) states readable in both modes
- [ ] Warning (yellow/amber) states readable in both modes
- [ ] Error (red) states readable in both modes
- [ ] Info (blue) states readable in both modes
- [ ] Neutral states adapt properly

---

## Known Issues to Fix

### 1. Select Component (`src/components/ui/select.tsx`)
**Issue**: Uses hardcoded colors instead of theme variables
```tsx
// BAD - Hardcoded
className="border-gray-200/80 bg-white text-gray-900"

// GOOD - Theme aware
className="border-border bg-card text-foreground"
```

### 2. Health Status Pill (`src/components/ui/health-status-pill.tsx`)
**Issue**: No dark mode variants
```tsx
// BAD - Only light mode
className="bg-emerald-50/60 text-emerald-700"

// GOOD - With dark mode
className="bg-emerald-50/60 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
```

---

## Color Mapping Reference

### Replacing Hardcoded Colors

| Hardcoded Light | Theme Token | Dark Equivalent |
|-----------------|-------------|-----------------|
| `bg-white` | `bg-background` or `bg-card` | Auto |
| `bg-gray-50` | `bg-muted` | Auto |
| `bg-gray-100` | `bg-muted` | Auto |
| `text-black` | `text-foreground` | Auto |
| `text-gray-900` | `text-foreground` | Auto |
| `text-gray-700` | `text-foreground` | Auto |
| `text-gray-500` | `text-muted-foreground` | Auto |
| `text-gray-400` | `text-muted-foreground` | Auto |
| `border-gray-200` | `border-border` | Auto |
| `border-gray-300` | `border-border` | Auto |

### Status Colors Pattern
```tsx
// Success
"bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300"

// Warning
"bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"

// Error
"bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"

// Info
"bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
```

---

## Audit Process

### Step 1: Search for Hardcoded Colors
Run these searches to find potential issues:

```bash
# Find hardcoded grays
rg "bg-gray-|text-gray-|border-gray-" --type tsx

# Find hardcoded white/black
rg "bg-white|bg-black|text-white|text-black" --type tsx

# Find colors without dark: prefix that might need it
rg "bg-(red|green|blue|yellow|amber|emerald|orange|purple|pink)-\d+" --type tsx

# Find slate colors (often used incorrectly)
rg "bg-slate-|text-slate-|border-slate-" --type tsx
```

### Step 2: Visual Testing
1. Open each dashboard in the browser
2. Toggle between light and dark mode using the theme toggle
3. Check each element against the checklist above
4. Screenshot any issues found

### Step 3: Fix Priority Order
1. **Critical**: Text unreadable or invisible
2. **High**: Buttons, badges, or status indicators broken
3. **Medium**: Borders or backgrounds incorrect
4. **Low**: Minor contrast or shadow issues

---

## Best Practices

### DO:
- Use CSS variables from `globals.css` (`bg-card`, `text-foreground`, `border-border`)
- Add explicit `dark:` variants for any hardcoded semantic colors
- Use opacity-based colors that work in both modes (e.g., `bg-primary/10`)
- Test both modes after every change
- Use the badge component's existing variants as reference

### DON'T:
- Use hardcoded `bg-white`, `text-gray-900`, etc. without dark mode fallback
- Use colors with poor contrast in either mode
- Forget to add `dark:` prefix when using semantic colors (red, green, blue, etc.)
- Use pure white text on light backgrounds or pure black on dark backgrounds
- Forget hover and focus states

---

## Execution Instructions

For the AI agent performing this audit:

1. **Read each file** listed in the "Dashboards to Audit" and "UI Components to Audit" sections
2. **Search for patterns** using the search commands in "Audit Process > Step 1"
3. **Identify violations** against the checklist
4. **Create a report** listing:
   - File path
   - Line number(s)
   - Current code
   - Recommended fix
   - Priority (Critical/High/Medium/Low)
5. **Fix the issues** starting with Critical/High priority
6. **Verify fixes** by checking for linter errors

### Output Format for Issues Found

```markdown
## Issue: [Component/Page Name]
**File**: `path/to/file.tsx`
**Line(s)**: XX-XX
**Priority**: High/Medium/Low
**Issue Type**: Text/Background/Border/Button/Badge/etc.

**Current Code**:
```tsx
className="bg-white text-gray-900 border-gray-200"
```

**Recommended Fix**:
```tsx
className="bg-card text-foreground border-border"
```

**Reason**: Hardcoded colors don't adapt to dark mode
```

---

## Completion Criteria

The audit is complete when:
- [ ] All dashboards (Institution, QCTO, Platform Admin, Student, Account) checked
- [ ] All UI components in `src/components/ui/` reviewed
- [ ] All shared layout components reviewed
- [ ] No hardcoded gray colors remain without dark mode fallbacks
- [ ] All status colors have dark mode variants
- [ ] Visual testing confirms both modes look correct
- [ ] No linter errors introduced by fixes

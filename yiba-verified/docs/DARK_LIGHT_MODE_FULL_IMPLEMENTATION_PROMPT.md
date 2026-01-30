# Dark / Light Mode Switcher — Full Implementation Prompt

Use this prompt to fully implement and fix the dark/light mode switcher across the Yiba Verified application. Many sections still need fixes so that every area respects the user’s theme choice and has no hardcoded colors or missing toggles.

---

## 1. Goal

- **Ensure the theme switcher is available and consistent** everywhere the user can change theme (auth, marketing, dashboards, account, onboarding).
- **Fix all sections that break or look wrong in dark mode** by replacing hardcoded colors with theme tokens and adding `dark:` variants where needed.
- **Standardize on design tokens** so future changes stay consistent.

---

## 2. Current State (Do Not Regress)

### Theme stack

- **Provider**: `next-themes` in `src/app/providers.tsx`
  - `attribute="class"` (`.dark` on `<html>`)
  - `defaultTheme="light"` (no OS sync)
  - `enableSystem={false}`
  - `storageKey="yiba-theme"`
- **CSS**: `src/app/globals.css`
  - `:root` = light tokens; `.dark` = dark tokens
  - Tokens: `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--input`, `--accent`, gradients, shadows, etc.
- **Tailwind**: Class-based dark mode via `@custom-variant dark (&&:where(.dark, .dark *))` so `dark:` utilities work.

### Where the theme toggle appears

| Location | Component | File |
|----------|-----------|------|
| App shell (all dashboards + account) | Topbar | `src/components/layout/Topbar.tsx` |
| Auth (login, reset-password, accept-invite) | AuthLayout | `src/components/auth/AuthLayout.tsx` |
| Marketing (home, pricing, contact, etc.) | MarketingNav (desktop + mobile) | `src/components/marketing/MarketingNav.tsx` |
| Student onboarding wizard | Header area | `src/components/student/onboarding/StudentOnboardingWizard.tsx` |

All dashboard/account routes use `AppShell` → `Topbar` → `ThemeToggle`, so the toggle is already present there. Do not remove it; ensure it remains visible and working.

### Related docs (read and align with)

- **`docs/DISABLE_OS_THEME_SYNC.md`** — Provider is already set to `defaultTheme="light"`, `enableSystem={false}`. Do not reintroduce system theme.
- **`docs/LIGHT_DARK_MODE_AUDIT_PROMPT.md`** — Full audit checklist, dashboards list, UI components list, color mapping, search commands, and fix patterns. Use it as the detailed checklist for “fix all sections.”

---

## 3. Toggle Placement Checklist

Verify the theme toggle is present and usable in:

- [ ] **Marketing**: MarketingNav (desktop and mobile menu). Already present; confirm both branches render `ThemeToggle`.
- [ ] **Auth**: AuthLayout (e.g. login, reset-password, accept-invite). Already in top-right; confirm no layout overflow hides it.
- [ ] **Dashboards**: Institution, QCTO, Platform Admin, Student (when using AppShell). Toggle is in Topbar; confirm Topbar is always rendered.
- [ ] **Account**: Account area uses AppShell → Topbar; confirm theme toggle appears in header.
- [ ] **Student onboarding**: Wizard header; confirm toggle is visible on all steps and during loading.
- [ ] **Standalone/static pages**: Terms, Privacy, How it works, Contact, etc. These use marketing layout; confirm MarketingNav (and thus toggle) is used.

If any route does not go through one of these layouts, add a `ThemeToggle` in that route’s layout or a shared header so the user can switch theme there too.

---

## 4. Sections That Need Fixing (Examples and Priorities)

Many components still use hardcoded grays, white, or black, or semantic colors without `dark:` variants. Fix them in this order.

### 4.1 High priority — layout and shell

- **`src/components/account/AccountLayout.tsx`**
  - Mobile sidebar toggle button uses `text-gray-600 hover:text-gray-900 hover:bg-gray-50`. Replace with theme tokens and dark variants (e.g. `text-muted-foreground hover:text-foreground hover:bg-muted`).
- **`src/components/layout/Topbar.tsx`**
  - Already uses theme-aware and `dark:` classes; only change if you find new hardcoded colors.
- **`src/components/layout/Sidebar.tsx`**
  - Audit for `bg-white`, `text-gray-*`, `border-gray-*`; replace with `bg-card`, `text-foreground` / `text-muted-foreground`, `border-border` and add `dark:` where needed.
- **`src/components/shared/ViewAsUserBanner.tsx`**
  - Ensure background, text, and borders use theme tokens and work in dark mode.

### 4.2 High priority — UI primitives

- **`src/components/ui/select.tsx`**  
  Use `border-border`, `bg-card`, `text-foreground` (and dark variants if any remain), not `border-gray-200`, `bg-white`, `text-gray-900`.
- **`src/components/ui/health-status-pill.tsx`**  
  Add `dark:` variants for all status colors (e.g. success, warning, error) so pills are readable in dark mode.
- **`src/components/ui/button.tsx`**, **`badge.tsx`**, **`input.tsx`**, **`card.tsx`**  
  Ensure every variant has appropriate dark mode styles (no pure white/black that clash with theme).

### 4.3 Medium priority — feature components and pages

- **Student**: `StudentOnboardingWizard.tsx`, `OnboardingStepWrapper.tsx`, `StudentProfileClient.tsx`, `StudentCVVersionsTable.tsx`, `StudentCVPreview.tsx`, `src/app/student/page.tsx`.
- **Institution**: `ReadinessFormStepContent.tsx`, institution learners/staff/readiness/enrolments/attendance pages.
- **QCTO**: `QctoDashboardClient.tsx`, institutions, submissions, team, evidence-flags, requests pages.
- **Platform Admin**: users, institutions, learners, invites, invites/analytics, qualifications, system-health, audit-logs pages.
- **Shared**: `InstitutionSearch.tsx`, `GlobalSearch.tsx`, `Backgrounds.tsx`, `BulkInviteDrawer.tsx`, form components that use colored boxes (info, warning, success).

For each:

- Replace `bg-white` → `bg-card` or `bg-background`; `text-gray-900` → `text-foreground`; `text-gray-500/600` → `text-muted-foreground`; `border-gray-200` → `border-border`.
- For semantic colors (red, green, blue, amber, etc.), add explicit `dark:` variants (e.g. `dark:bg-*-950/50 dark:text-*-300`) so they remain readable.

### 4.4 Lower priority — marketing and static

- Marketing pages (home, pricing, contact, security, how-it-works), footer, nav.
- Terms, Privacy Policy: prose already uses `dark:prose-invert`; ensure page background and containers use theme tokens.

### 4.5 Files known to contain hex/rgb (candidates for cleanup)

These files were flagged as containing raw hex/rgb; audit and replace with Tailwind theme tokens or theme-aware classes:

- `StudentOnboardingWizard.tsx`, `OnboardingStepWrapper.tsx`
- `AccountSidebar.tsx`, `Sidebar.tsx`
- `platform-admin/users/page.tsx`, `qualifications/page.tsx`, `learners/page.tsx`, `institutions/page.tsx`, `invites/analytics/page.tsx`
- `qcto/institutions/page.tsx`, `QctoDashboardClient.tsx`, `submissions/[submissionId]/page.tsx`
- `institution/readiness/[readinessId]/page.tsx`, `staff/page.tsx`, `attendance/*`, `enrolments/page.tsx`
- `student/page.tsx`, `StudentProfileClient.tsx`, `StudentCVVersionsTable.tsx`, `StudentCVPreview.tsx`
- `Backgrounds.tsx`
- Any other file that uses `#...` or `rgb(...)` for UI (not for logos/brand assets).

---

## 5. Search Commands (Use These to Find Violations)

Run from repo root (e.g. `yiba-verified/`):

```bash
# Hardcoded grays
rg "bg-gray-|text-gray-|border-gray-" --type tsx src/

# Hardcoded white/black (often need theme tokens)
rg "bg-white|bg-black|text-white|text-black" --type tsx src/

# Semantic colors that may need dark: variants
rg "bg-(red|green|blue|yellow|amber|emerald|orange|purple|pink|teal|cyan|indigo|violet|sky)-\d+" --type tsx src/

# Slate (often used like gray)
rg "bg-slate-|text-slate-|border-slate-" --type tsx src/
```

Prefer fixing in this order: (1) layout/shell, (2) UI primitives, (3) high-traffic pages (dashboards, account, onboarding), (4) remaining feature and marketing pages.

---

## 6. Fix Patterns

- **Backgrounds**: `bg-white` → `bg-card` or `bg-background`; `bg-gray-50` / `bg-gray-100` → `bg-muted` or `bg-muted/50`.
- **Text**: `text-gray-900` / `text-black` → `text-foreground`; `text-gray-500` / `text-gray-600` → `text-muted-foreground`.
- **Borders**: `border-gray-200` / `border-gray-300` → `border-border`.
- **Status colors** (success, warning, error, info): add dark variants, e.g.  
  `bg-green-50 text-green-700` → `bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300`  
  (and similarly for amber, red, blue).
- **Shadows**: In `globals.css`, dark mode already reduces shadow; in components avoid hardcoded shadows that look wrong in dark. Prefer `shadow-[var(--shadow-soft)]` etc., or add `dark:shadow-none` / `dark:shadow-*` if needed.

Do not introduce `enableSystem` or `defaultTheme="system"`; keep theme user-driven and stored in `yiba-theme`.

---

## 7. Step-by-Step Execution (For an AI or Developer)

1. **Read** `docs/DISABLE_OS_THEME_SYNC.md` and `docs/LIGHT_DARK_MODE_AUDIT_PROMPT.md` so behavior and checklist are clear.
2. **Confirm** theme provider in `src/app/providers.tsx` remains `defaultTheme="light"`, `enableSystem={false}`, `storageKey="yiba-theme"`.
3. **Verify** theme toggle placement (Section 3) on marketing, auth, dashboards, account, and onboarding; add toggle only where a route has no header that already provides it.
4. **Fix layout/shell** (Section 4.1): AccountLayout, Sidebar, ViewAsUserBanner.
5. **Fix UI primitives** (Section 4.2): select, health-status-pill, button, badge, input, card.
6. **Run** the search commands (Section 5) and fix files by priority (Section 4.3–4.5), applying patterns from Section 6 and from `LIGHT_DARK_MODE_AUDIT_PROMPT.md`.
7. **Manually test** key flows in both themes: login, one dashboard (e.g. platform-admin or institution), account profile, student onboarding, marketing home and pricing. Toggle theme and confirm no broken contrast, invisible text, or wrong backgrounds.
8. **Lint**: run the project linter and fix any new issues.

---

## 8. Completion Criteria

- [ ] Theme toggle is present and usable on marketing, auth, all dashboards, account, and student onboarding.
- [ ] No hardcoded `bg-white`, `bg-black`, `text-gray-*`, `border-gray-*` (or equivalent) in layout, Topbar, Sidebar, AccountLayout, ViewAsUserBanner, or UI primitives; use theme tokens and `dark:` instead.
- [ ] All UI components listed in `LIGHT_DARK_MODE_AUDIT_PROMPT.md` have been audited and fixed for dark mode.
- [ ] Status colors (badges, pills, alerts) have explicit `dark:` variants and are readable in both themes.
- [ ] Key user flows have been visually tested in both light and dark mode with no regressions.
- [ ] Linter is clean and provider config remains `defaultTheme="light"`, `enableSystem={false}`.

When all of the above are done, the dark/light mode switcher can be considered fully implemented and all sections fixed for both themes.

# QCTO Onboarding and Invite Flow Fix – Implementation Prompt

## Summary

Fix QCTO onboarding UX so it matches platform-admin onboarding (modal overlay with blur, no visible shell), correct invite-accepted behaviour (read-only province display, no editing), fix the broken Alert in the wizard, and ensure the shell (topbar/sidebar) is not visible until onboarding is complete.

---

## 1. Root Cause: Empty / Disabled Alert in QCTO Onboarding

**Problem:** The QCTO onboarding wizard uses `<Alert>` with `<AlertDescription>` as **children**. The shared `Alert` component (`@/components/ui/alert`) only renders `title` and `description` **props**; it **never renders `children`**. The `AlertDescription` import may also be invalid (not exported from `alert.tsx`). Result: the Alert shows only the icon (and optional default styling), with no visible copy — it looks empty or “disabled.”

**Fix:**

- Use `Alert` with the `description` (and optionally `title`) **props** only. Do not use `AlertDescription` or pass children for the main content.
- Example:  
  `Alert` with `title="Province assignment"` and `description={<>Default Province: … Assigned Provinces: …</>}`.
- Remove any `AlertDescription` import from `@/components/ui/alert` if it does not exist there.

---

## 2. Modal Overlay (Platform-Admin Style)

**Problem:** QCTO onboarding is rendered as a `Card` inside the main content area. The AppShell (topbar, sidebar) remains fully visible. Users can see and potentially interact with nav while onboarding is incomplete.

**Fix:**

- Make QCTO onboarding a **modal overlay** like platform-admin onboarding:
  - Use `createPortal(overlay, document.body)` so the overlay sits above everything.
  - Overlay: `fixed inset-0 z-[100]`, centered content.
  - **Blurred backdrop:** `absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xl` so the shell (and any page behind) is fully covered and not visible.
  - Modal card: same pattern as `PlatformAdminOnboardingWizard` — `Card` with `overflow-hidden`, `shadow-xl` / `dark:shadow-2xl`, `ring-1 ring-border/80`, etc. Works in both **light and dark** mode.
- Reference: `@/components/platform-admin/onboarding/PlatformAdminOnboardingWizard.tsx` (overlay structure, blur, card styling, `createPortal` usage).
- Ensure the overlay blocks all interaction with the rest of the app (no clicking through to sidebar/topbar).
- Optional: mount check (`mounted` state + `useEffect`) before portalling to avoid SSR/hydration issues, as in the platform-admin wizard.

---

## 3. Invite-Accepted Users: Read-Only Province, No Editing

**Context:** Users who accept a QCTO invite (e.g. QCTO Viewer) already have `default_province` and `assigned_provinces` set from the invite. They should not change these.

**Requirements:**

- **Show** default province and assigned provinces so users can see where they are assigned.
- **Do not allow** changing default province or selecting/deselecting other provinces.
- **No** province Select or Checkbox UI for invite-accepted users.
- Provide a single **Confirm / Acknowledge** action (e.g. “Confirm and continue”) that:
  - Calls `POST /api/qcto/onboarding/complete` with the **existing** `default_province` and `assigned_provinces` (no user edits).
  - On success, marks onboarding complete and navigates to `/qcto` (or equivalent).

**Detection of “invite-accepted” flow:**

- Treat user as invite-accepted when **both** are true:
  - `initialData.default_province` is set (non-empty).
  - `initialData.assigned_provinces` is a non-empty array.
- Exclude `QCTO_SUPER_ADMIN` (they do not use province assignment).

**UI for invite-accepted:**

- Short, clear copy, e.g. “You have been assigned to [Default Province]. Your assigned provinces: [X, Y, …].”
- Use `Alert` **props** (`title` / `description`) for any info message; ensure content is always visible (see §1).
- Single primary button: “Confirm and continue” (or similar). No province form.

---

## 4. Non–Invite-Accepted Users (Edge Cases)

**Context:** Users who have no province pre-set (e.g. created by platform admin without an invite, or other edge cases).

**Requirements:**

- Keep a **configurable** province flow **inside the same modal**:
  - Default province: required (select one).
  - Assigned provinces: at least one; default must be included.
- Reuse existing validation and `POST /api/qcto/onboarding/complete` contract.
- Use `Alert` via `title` / `description` props only (see §1). No `AlertDescription` children.

---

## 5. Shell Not Visible Until Onboarding Complete

**Problem:** Topbar and sidebar are visible **before** the user completes QCTO onboarding.

**Fix:**

- **Option A (recommended):** Keep the current layout structure (layout still renders `AppShell`), but the onboarding **page** renders **only** the modal overlay (via `createPortal` to `document.body`). The overlay uses a **full-screen blurred backdrop** that fully obscures the shell. From the user’s perspective, only the modal is visible until they complete onboarding.
- **Option B:** If the layout can detect “onboarding incomplete” **before** rendering `AppShell`, skip rendering the shell for the onboarding route and render only the onboarding UI (e.g. modal or minimal wrapper). Ensure no flash of sidebar/topbar.

Consistency with platform-admin onboarding (modal over shell, blur hiding everything) favours **Option A**. Ensure the blur/backdrop is strong enough that the shell is not discernible.

---

## 6. Select “Disabled” Placeholder

**Problem:** The default-province `Select` includes `<option value="" disabled>Select your default province</option>`. When `defaultProvince` is `""`, the Select shows this disabled option as selected, which can look broken or “disabled.”

**Fix:**

- For **invite-accepted** users, remove the province Select entirely (read-only display only).
- For **non–invite-accepted** users, either:
  - Use a proper `placeholder` on the Select (if the component supports it) without a selected disabled option, or
  - Ensure we never use `value=""` as the actual selected value when we have a valid default (e.g. pre-select first valid option when appropriate). Avoid showing the disabled empty option as the chosen value.

---

## 7. Accept Invite Page: Province When Required

**Context:** QCTO roles such as `QCTO_VIEWER` require `default_province` (and `assigned_provinces`). Accept API uses `invite.province` or `body.default_province`. The accept-invite page currently sends only `{ token, password? }`.

**Recommendation:**

- **Invite creation:** For province-required roles (`QCTO_VIEWER`, etc.), require province when creating the invite (team-invites UI and `POST /api/qcto/invites`). Reject invites without province for those roles.
- **Accept page:** If the invite has no province for a province-required role, either:
  - Show an error and do not allow accept until the inviter fixes the invite, or
  - Add a province selector on the accept page **only** when `invite.province` is missing and the role requires province, and send `default_province` / `assigned_provinces` in the accept request.

Implementing invite-creation validation (and optionally accept-page province when needed) prevents “Role QCTO_VIEWER requires a default_province” after accept.

---

## 8. Implementation Checklist

- [ ] **Alert:** Use only `title` / `description` props for `Alert` in QCTO onboarding; remove `AlertDescription` children and invalid imports.
- [ ] **Modal overlay:** Convert QCTO onboarding to a `createPortal`-based modal (like platform-admin), with full-screen blurred backdrop, dark/light–friendly `Card`, and no shell visible.
- [ ] **Invite-accepted:** Detect via `initialData.default_province` + `initialData.assigned_provinces`; show read-only assignment, single “Confirm and continue” action; POST existing provinces to complete.
- [ ] **Non–invite-accepted:** Keep province form in modal; fix Select placeholder/disabled-option behaviour.
- [ ] **Shell:** Ensure overlay fully covers shell (blur + opacity); no topbar/sidebar visible before onboarding complete.
- [ ] **Invite flow:** Require province for province-required roles on invite creation; optionally support province on accept page when invite lacks it.

---

## 9. Files to Touch

- `src/components/qcto/onboarding/QctoOnboardingWizard.tsx` – Modal overlay, invite vs non-invite flows, Alert props, province read-only vs form.
- `src/app/qcto/onboarding/page.tsx` – Keep passing `initialData` and `userRole`; ensure no layout change unless you adopt Option B (§5).
- `src/app/qcto/layout.tsx` – Only if changing when AppShell is rendered (Option B).
- `src/components/qcto/OnboardingGuard.tsx` – Retain redirect logic; ensure it works with modal-only onboarding page.
- Invite creation/accept: `src/app/qcto/team-invites/` (create), `src/app/auth/qcto/accept-invite/page.tsx` and `src/app/api/qcto/invites/accept/route.ts` (accept) – if implementing §7.

---

## 10. References

- `PlatformAdminOnboardingWizard`: overlay structure, blur, `createPortal`, card styling.
- `Alert` component: use `title` / `description` props only; no children for body content.
- `POST /api/qcto/onboarding/complete`: existing contract; support both “confirm-only” (existing provinces) and “form” (user-selected provinces) flows.

---

## 11. Implementation Summary (Done)

- **QctoOnboardingWizard** rewritten:
  - Modal overlay via `createPortal(overlay, document.body)`; full-screen blur backdrop (`bg-black/50` / `dark:bg-black/70`, `backdrop-blur-xl`). Card styling aligned with platform-admin (light/dark).
  - **Invite-accepted:** `initialData.default_province` + `initialData.assigned_provinces` set → read-only Alert showing assignment; single "Confirm and continue" button; POST existing provinces, then `window.location.href = "/qcto"`.
  - **Non–invite-accepted:** Province form (default Select, assigned checkboxes) in modal; validation unchanged.
  - **QCTO_SUPER_ADMIN:** Alert + "Complete Onboarding"; POST `null` / `[]`.
- **Alert:** All usage via `title` and `description` props only; `AlertDescription` removed.
- **API:** `CompleteOnboardingBody.default_province` typed as `string | null` for super-admin.
- **Shell:** Layout still renders `AppShell`; overlay covers everything. No layout changes.
- **Invite creation/accept** (§7): Not implemented; prompt left for follow-up.

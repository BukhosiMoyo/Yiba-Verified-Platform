# Multi-Institution Application Logic

This document describes how "current institution" is resolved, where the context switcher lives, and how institution-scoped data is applied for users with multiple institutions (Prompt 4).

## Current institution resolution

### Helper: `getCurrentInstitutionForUser(userId, preferredIdFromCookie)`

- **Location:** `src/lib/currentInstitution.ts`
- **Returns:** `{ currentInstitutionId, institutionIds, institutions }` where `institutions` is an array of `{ institution_id, legal_name, branch_code, registration_number }`.

**Resolution order for current institution:**

1. **Preferred from cookie:** If `preferredIdFromCookie` is set and is in the user's institution list, use it.
2. **Primary:** Otherwise use the institution marked `is_primary: true` in `UserInstitution`.
3. **First:** Otherwise use the first institution by `created_at`.

**Backward compatibility:** If the user has no `UserInstitution` rows, the helper falls back to `User.institution_id` and loads that single institution. This supports users who only have the legacy `institution_id` set.

### Where resolution runs

- **API context (`requireAuth`):** For `INSTITUTION_ADMIN` and `INSTITUTION_STAFF`, `requireAuth` in `src/lib/api/context.ts` reads the `current_institution_id` cookie, calls `getCurrentInstitutionForUser(userId, preferredId)`, and sets:
  - `ctx.institutionId` = resolved current institution ID
  - `ctx.institutionIds` = all institution IDs the user can access
- **Institution layout:** The institution layout (`src/app/institution/layout.tsx`) also calls `getCurrentInstitutionForUser` (with the same cookie) to pass `institutions` and `currentInstitutionId` to the shell for the context switcher UI. Resolution is only done when the user is not "viewing as" another user.

## Cookie

- **Name:** `current_institution_id`
- **Set by:** `POST /api/institution/context` (body: `{ institution_id }`). The API validates that `institution_id` is in the user's `institutionIds`.
- **Read by:** `requireAuth` (for API context) and institution layout (for switcher props).
- **Options:** `path: /`, `maxAge: 1 year`, `httpOnly`, `secure` in production, `sameSite: lax`.

## APIs

| Endpoint | Purpose |
|----------|---------|
| `GET /api/institutions/mine` | Returns `{ currentInstitutionId, institutionIds, institutions }` for the current user. Used by the context switcher (and can be used for client-side refresh). |
| `POST /api/institution/context` | Sets `current_institution_id` cookie. Body: `{ institution_id: string }`. Validates that the user has access to that institution. |

## Context switcher

- **Component:** `InstitutionContextSwitcher` in `src/components/institution/InstitutionContextSwitcher.tsx`.
- **Rendered when:** User has more than one institution (`institutions.length > 1`). Only shown for the actual user (not when "viewing as" another user).
- **Placement:** Institution layout passes `institutions` and `currentInstitutionId` to `AppShell`, which passes them to `Topbar`. The Topbar renders `InstitutionContextSwitcher` in the left area (desktop only, `lg:flex`).
- **Behaviour:** Dropdown lists all institutions (label: `legal_name` or `legal_name (branch_code)`). On change, the component POSTs to `/api/institution/context` with the selected `institution_id`, then reloads the page so all server-rendered and API data use the new context.

## Data access rules

- **`ctx.institutionId`:** Always the resolved "current" institution for institution roles. All existing institution-scoped API routes that filter by `ctx.institutionId` now automatically use the current institution (including after a context switch via cookie).
- **`ctx.institutionIds`:** All institution IDs the user can access. Use when a route must allow access to "any of my institutions" (e.g. cross-institution lists or admin views). Most scoped routes use only `ctx.institutionId` for "current institution" filtering.
- **Pages:** Institution pages (dashboard, readiness, learners, staff, etc.) rely on APIs that use `requireAuth`; those APIs already use the resolved `ctx.institutionId`, so no page-level change is required for current-institution scoping. Use `ctx.institutionIds` only where the product requires "all my institutions" behaviour.

## Summary

- **Current institution** = cookie if valid → else primary → else first; implemented in `getCurrentInstitutionForUser`.
- **Context switcher** = Topbar (institution layout only), visible when the user has multiple institutions; sets cookie and reloads.
- **API and layout** both use the same cookie and helper so that UI and API stay in sync after a switch.

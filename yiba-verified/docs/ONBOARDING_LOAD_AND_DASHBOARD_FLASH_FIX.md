# Onboarding Load Time and Dashboard Flash Fix

## Problem

1. **Onboarding takes too long to load** when signing up or logging in for the first time (role-specific onboarding: student, institution admin, QCTO, platform admin).
2. **Dashboard flashes briefly** before redirecting to the onboarding page — users see the dashboard (or app shell) for a moment, then are sent to onboarding.

## Root Causes

### Dashboard flash

- **QCTO**: Onboarding is enforced by a **client-side** `OnboardingGuard` that runs in `useEffect` and calls `router.push("/qcto/onboarding")`. The server still renders the full layout and dashboard; only after hydration does the client redirect, so the dashboard is visible for a moment.
- **Student**: The redirect happens in the **dashboard page** (`/student`), not in the layout. The layout (with AppShell) runs first and can stream; then the page runs and redirects. Users can see the app shell (sidebar) before the redirect.
- **Institution / Platform admin**: Redirect is done in the layout on the server, but layout runs after middleware and may stream, so a brief shell can still appear before the redirect.

### Slow perceived load

- Onboarding status is resolved **inside each area’s layout** (and for student, in the dashboard page) via DB or cache. The user waits for: session → view-as (if any) → onboarding check → redirect. Multiple async steps delay the first paint of the correct screen.
- No redirect happens at the **edge** (middleware), so every first load into an area hits the full layout and possibly the dashboard page before redirecting.

## Required Behavior

1. **No dashboard flash**: Users who have not completed onboarding must never see the dashboard or app shell for their area. They should be sent directly to the onboarding route.
2. **Faster first paint**: Redirect to onboarding should happen as early as possible (ideally in middleware) so the browser loads the onboarding URL directly and avoids extra layout/dashboard work.

## Solution (Implementation Outline)

### 1. Put `onboarding_completed` in the session/JWT

- In **auth** (e.g. `lib/auth.ts`):
  - In `authorize` (credentials and impersonation), include `onboarding_completed` from the DB user in the returned user object.
  - In the **JWT callback**, set `token.onboarding_completed` when `user` is present, and when `trigger === "update"` and `sessionData.onboarding_completed` is provided (so completing onboarding can update the token).
  - In the **session callback**, pass `onboarding_completed` from the token to `session.user`.
- Extend NextAuth **User**, **Session**, and **JWT** types to include `onboarding_completed` (boolean).

This allows middleware and layout to use the same flag without an extra DB call for the redirect decision.

### 2. Redirect in middleware when onboarding is not complete

- In **middleware**, after validating the token and role for a protected area:
  - Read `onboarding_completed` from the token (if not present, treat as `false` for safety).
  - Define “dashboard” vs “onboarding” paths per area, e.g.:
    - Student: dashboard = `/student` (exact), onboarding = `/student/onboarding`.
    - Institution: dashboard = `/institution` or `/institution/*` except `/institution/onboarding`.
    - QCTO: dashboard = `/qcto` or `/qcto/*` except `/qcto/onboarding`.
    - Platform admin: dashboard = `/platform-admin` or `/platform-admin/*` except `/platform-admin/onboarding`.
  - If the request is for a **dashboard** path (not onboarding) and the user’s role requires onboarding and `onboarding_completed === false`, **redirect** to the corresponding onboarding URL (e.g. `/student/onboarding`, `/institution/onboarding`, `/qcto/onboarding`, `/platform-admin/onboarding`).
  - Do **not** redirect when the user is already on the onboarding path or when the role does not require onboarding (e.g. QCTO_SUPER_ADMIN, PLATFORM_ADMIN for QCTO).

Result: First load after login goes straight to the onboarding URL when needed, so no dashboard or shell is rendered for that request.

### 3. QCTO: server-side redirect in layout (remove client-only redirect)

- In **QCTO layout**:
  - Keep loading onboarding status (from DB/cache or from session if available).
  - If the user must complete onboarding and is not on `/qcto/onboarding`, call **server-side** `redirect("/qcto/onboarding")` in the layout **before** rendering `AppShell` and children.
- Remove or simplify **OnboardingGuard**: it should no longer be responsible for “not completed → onboarding” (middleware + layout do that). It can remain only for “onboarding completed but user is still on `/qcto/onboarding` → redirect to dashboard” if that case is not already handled by the layout.

This ensures that even if a request slips past middleware, the server never sends the dashboard HTML for QCTO when onboarding is incomplete.

### 4. Student / Institution / Platform admin layouts

- **Student**: Middleware redirect from `/student` to `/student/onboarding` when `onboarding_completed === false` avoids rendering the student layout/dashboard for that path. Layout can keep using `OnboardingLayoutWrapper`; no need to duplicate the redirect in the layout if middleware is the single source of truth for “/student → onboarding”.
- **Institution / Platform admin**: Same idea — middleware redirect from dashboard paths to onboarding when `onboarding_completed === false` (and role requires onboarding). Layouts can keep their existing server-side redirect as a fallback so the dashboard never renders.

### 5. Update session after completing onboarding

- When the user **completes** onboarding (any role), the API updates the DB and returns success. The client should then call NextAuth **session update** with `onboarding_completed: true` (e.g. `update({ onboarding_completed: true })`) before navigating to the dashboard (or the API returns a redirect and the client updates then navigates). That way the JWT is updated and the next request (e.g. to the dashboard) will see `onboarding_completed === true` in middleware and in layout, avoiding redirect loops and flashes.

### 6. Loading state for onboarding pages

- Add Next.js `loading.tsx` for each onboarding route (`/student/onboarding`, `/institution/onboarding`, `/qcto/onboarding`, `/platform-admin/onboarding`) so users see a spinner immediately while the page loads. This addresses “onboarding takes way too much time loading” from a UX perspective.

## Files to Touch (Summary)

- **Auth**: `lib/auth.ts` — add `onboarding_completed` to user return, JWT and session callbacks, and type declarations.
- **Middleware**: `middleware.ts` — add onboarding redirect rules using `token.onboarding_completed` and path/role.
- **Onboarding complete flows** (institution, platform-admin, qcto, student): after successful API response, call `update({ onboarding_completed: true })` then redirect so the JWT stays in sync.
- **Loading UI**: Add `loading.tsx` in each onboarding route folder for immediate feedback while the page loads.

## Testing

- New user (each role): sign up / accept invite, log in → should land on onboarding URL with no dashboard flash.
- Complete onboarding → session update → navigate to dashboard → should see dashboard, no redirect back to onboarding.
- User with onboarding already complete → log in → should go to dashboard, not onboarding.
- Direct URL to `/student`, `/institution`, `/qcto`, `/platform-admin` with incomplete onboarding → should redirect to the correct onboarding route without showing dashboard or shell first.

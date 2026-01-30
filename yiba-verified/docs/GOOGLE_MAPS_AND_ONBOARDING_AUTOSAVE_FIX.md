# Google Maps Autocomplete + Onboarding Autosave Fix

## Problems

1. **Console error**: "Failed to load Google Maps script" at `GooglePlacesAutocomplete.tsx:88` — the script tag’s `onerror` fires, so the script never loads.
2. **Google Maps autofill not working** — address suggestions don’t appear because the script is blocked or fails to load.
3. **Onboarding data loss on refresh** — user wants autosave so that refreshing the page doesn’t lose entered data.

## Root Causes

### Google Maps script failure

- **Content Security Policy (CSP)** in middleware only allows `script-src 'self'`. Loading a script from `https://maps.googleapis.com/maps/api/js` is blocked by the browser, so the script never loads and `onerror` runs.
- **connect-src 'self'** blocks the Places API from making requests to Google’s servers.
- Optional: missing or invalid `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, or Google requiring a callback for async loading.

### Autosave / data loss

- Student onboarding already has **autosave** (debounced save per step via `onAutoSave` and `/api/student/onboarding/save`). Gaps:
  - **AddressStep** uses `onAutoSave` but its TypeScript interface doesn’t declare it (minor).
  - **Pending debounced save** can be lost if the user refreshes or closes the tab before the 1s debounce fires — need to flush save on `beforeunload` or `visibilitychange` (page hide).

## Required Behavior

1. **Google Maps**
   - Allow the Maps/Places script and API requests: update CSP so `script-src` and `connect-src` include Google’s domains.
   - On script load failure: don’t break the form; show a **fallback plain text input** so the user can still type their address. Optionally show a short “Suggestions unavailable” message.
   - Avoid noisy console errors in production; log meaningfully in development only if desired.

2. **Onboarding autosave**
   - Keep existing debounced autosave per step.
   - **Flush autosave on page unload**: when the user refreshes or leaves the tab, immediately save current step data (cancel debounce and run save once) so the next visit resumes with the latest data.
   - Add `onAutoSave` to `AddressStep`’s props interface for consistency.

## Solution (Implementation Outline)

### 1. CSP: allow Google Maps script and connections

In **middleware** where CSP is set:

- **script-src**: Add `https://maps.googleapis.com` so the Maps/Places JS can load.
- **connect-src**: Add `https://maps.googleapis.com https://*.googleapis.com` (and if needed for tiles/fonts, `https://*.gstatic.com`) so the Places API and map tiles can run.

Example:

```ts
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
"connect-src 'self' https://maps.googleapis.com https://*.googleapis.com https://*.gstatic.com",
```

### 2. GooglePlacesAutocomplete: graceful failure + fallback

In **`components/shared/GooglePlacesAutocomplete.tsx`**:

- **Script load failure**: Track a `scriptError` (or `fallbackMode`) state. In `script.onerror`, set it to true and call `setScriptLoading(false)`. Optionally log only in development (`process.env.NODE_ENV === 'development'`).
- **Fallback UI**: When the script has failed (or API key is missing), render a normal `<Input>` that still uses `value` and `onChange` so the user can type the address. No autocomplete, but form still works. Optionally show a small hint: “Enter your address (suggestions unavailable).”
- **API key missing**: If `!apiKey`, set fallback mode immediately and don’t inject the script; show the same plain input.
- Keep existing logic when the script loads successfully (autocomplete, `onPlaceSelect`).

### 3. Onboarding: flush autosave on page unload

In **`StudentOnboardingWizard`**:

- Keep the existing debounced `autoSave(step, stepData)` and the 1s timeout.
- **Flush on leave**: Add a `beforeunload` or `visibilitychange` (e.g. when `document.visibilityState === 'hidden'`) listener that:
  - Clears any pending debounce timeouts for autosave.
  - Builds the current step’s data from local state (same shape as `onNext`/`onAutoSave`) and calls `saveStep(currentStep, stepData, true)` once (or a dedicated “flush” that doesn’t show toasts). Use `navigator.sendBeacon` only if you need to guarantee the request fires on unload; otherwise a quick `fetch` to the save API is fine, but note that `beforeunload` is unreliable for async work — so prefer `visibilitychange` + short delay or synchronous sendBeacon for “last chance” save.
- **Practical approach**: On `visibilitychange` (hidden), immediately run the pending autosave (clear timeouts and call save with current step data). That way, when the user switches tab or closes the window, the latest data is saved before the page is torn down when possible.

### 4. AddressStep: add onAutoSave to props

In **`components/student/onboarding/steps/AddressStep.tsx`**:

- Add `onAutoSave?: (data: any) => void` to `AddressStepProps` so the component’s contract matches usage and autosave is explicit.

## Files to Touch

- **Middleware**: `middleware.ts` — extend CSP `script-src` and `connect-src` for Google Maps.
- **Google Places**: `components/shared/GooglePlacesAutocomplete.tsx` — script error state, fallback plain input when script fails or key missing, optional dev-only logging.
- **Student onboarding**: `components/student/onboarding/StudentOnboardingWizard.tsx` — flush autosave on `visibilitychange` (hidden) and clear debounce timeouts.
- **AddressStep**: `components/student/onboarding/steps/AddressStep.tsx` — add `onAutoSave` to the props interface.

## Testing

- **Google Maps**: With valid `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and updated CSP, load a page that uses `GooglePlacesAutocomplete` — script should load and address suggestions should work. With invalid key or CSP reverted, the fallback input should still allow typing and form submit.
- **Autosave**: Fill a step, wait for debounce to save, refresh — data should persist. Fill a step, switch tab or start to close window (trigger visibility hidden) — then reopen and refresh; data should be saved so resume shows the latest input.

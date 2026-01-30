# Debug Dashboard — Speed & Errors

A lightweight **in-app debugger** captures performance and errors so you can find slow loads and fix issues before they affect users.

## What it does

- **Core Web Vitals** — TTFB, FCP, LCP, CLS, INP (good / needs-improvement / poor)
- **Client errors** — `window.error` and unhandled promise rejections
- **Slow requests** — Any `fetch()` call that takes **≥3 seconds** (likely culprits for slow pages)
- **Server errors** — Logged in the **terminal** via Next.js instrumentation (`onRequestError`)

No external service or API key is required. Data is kept in memory in the browser (and in the server log for instrumentation).

## How to use it

1. **Open the debug page**  
   Go to [http://localhost:3000/debug](http://localhost:3000/debug) (or your app URL + `/debug`).

2. **Use the app in another tab**  
   Navigate, log in, open dashboards, etc. Metrics and errors are reported as you go.

3. **Check the dashboard**  
   - **Core Web Vitals** — Look for **poor** or **needs-improvement**; those are the ones to fix first (e.g. high LCP = slow main content, high TTFB = slow server).
   - **Client errors** — Fix the listed errors; they’re the same ones users would see (or worse, silent failures).
   - **Slow requests** — Each row is a URL that took ≥3s. Optimize those APIs or queries (e.g. add indexes, cache, or reduce payload).

4. **Server errors**  
   Check the **terminal** where `next dev` or `next start` is running. Each server request error is logged with path, method, and stack.

## Files

| File | Purpose |
|------|--------|
| `src/lib/debug-store.ts` | In-memory store for metrics, errors, slow requests; used by reporter and dashboard |
| `src/components/debug/DebugReporter.tsx` | Reports Web Vitals, global errors, and slow `fetch`; mounted in root layout |
| `src/app/debug/page.tsx` | Debug dashboard UI at `/debug` |
| `src/instrumentation.ts` | Next.js instrumentation; logs server request errors to console |

## Configuration

- **Slow request threshold** — In `DebugReporter.tsx`, `SLOW_REQUEST_MS = 3000`. Change it to log requests slower than e.g. 1s or 5s.
- **Max items** — In `debug-store.ts`, `MAX_ITEMS = 100`. Increase if you want a longer history.

## Libraries like this

- **Built-in** — Next.js `useReportWebVitals` (we use it) and `instrumentation.ts` (we use it).
- **Self-hosted / open source** — [OpenReplay](https://github.com/openreplay/openreplay) (session replay + performance), [Perfsee](https://github.com/perfsee/perfsee) (performance).
- **Hosted** — Vercel Analytics, Sentry, LogRocket, etc.

This setup is a **lightweight, zero-dependency** way to catch speed and errors during development and in staging without adding a third-party service.

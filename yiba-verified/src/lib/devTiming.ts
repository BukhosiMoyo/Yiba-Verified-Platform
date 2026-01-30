/**
 * Log slow API routes in development only.
 * Call at the end of a handler; logs when duration > 1s (or > 3s).
 */
export function devLogSlow(routeLabel: string, startMs: number, thresholdMs = 1000): void {
  if (process.env.NODE_ENV !== "development") return;
  const ms = Date.now() - startMs;
  if (ms >= thresholdMs) {
    // eslint-disable-next-line no-console
    console.warn(`[dev] ${routeLabel} slow: ${ms}ms`);
  }
}

"use client";

import { useReportWebVitals } from "next/web-vitals";
import { useEffect, useRef, useCallback } from "react";
import { addMetric, addError, addSlowRequest } from "@/lib/debug-store";

const SLOW_REQUEST_MS = 3000;

/**
 * Reports Web Vitals, global errors, and (optionally) slow fetch requests to the debug store.
 * Renders nothing. Mount once in root layout so the debug dashboard can show speed and errors.
 */
export function DebugReporter() {
  const fetchPatched = useRef(false);

  const handleWebVitals = useCallback((metric: { name: string; value: number; delta: number; rating?: string; navigationType?: string }) => {
    addMetric({
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      rating: (metric.rating ?? "good") as "good" | "needs-improvement" | "poor",
      navigationType: metric.navigationType ?? "navigate",
    });
  }, []);

  useReportWebVitals(handleWebVitals);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      addError({
        message: event.message ?? String(event.error),
        source: event.filename,
        stack: event.error?.stack,
        type: "error",
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message =
        event.reason instanceof Error
          ? event.reason.message
          : typeof event.reason === "string"
            ? event.reason
            : JSON.stringify(event.reason);
      const stack = event.reason instanceof Error ? event.reason.stack : undefined;
      addError({
        message: `Unhandled rejection: ${message}`,
        stack,
        type: "unhandledrejection",
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  // Patch fetch once per page load to log slow requests (>= SLOW_REQUEST_MS)
  useEffect(() => {
    if (typeof window === "undefined" || fetchPatched.current) return;
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const start = performance.now();
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? "GET";
      try {
        const res = await originalFetch(input, init);
        const durationMs = performance.now() - start;
        if (durationMs >= SLOW_REQUEST_MS) {
          addSlowRequest({
            url,
            method,
            durationMs,
            status: res.status,
          });
        }
        return res;
      } catch (err) {
        const durationMs = performance.now() - start;
        if (durationMs >= SLOW_REQUEST_MS) {
          addSlowRequest({
            url,
            method,
            durationMs,
          });
        }
        throw err;
      }
    };
    fetchPatched.current = true;
    // Intentionally do not restore fetch on unmount to avoid double-patch on remount
  }, []);

  return null;
}

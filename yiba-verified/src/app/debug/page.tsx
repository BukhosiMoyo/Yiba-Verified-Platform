"use client";

import { useEffect, useState } from "react";
import {
  getMetrics,
  getErrors,
  getSlowRequests,
  subscribe,
  clearAll,
  type WebVitalsMetric,
  type DebugError,
  type SlowRequest,
} from "@/lib/debug-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

function ratingColor(rating: string) {
  switch (rating) {
    case "good":
      return "text-emerald-600 dark:text-emerald-400";
    case "needs-improvement":
      return "text-amber-600 dark:text-amber-400";
    case "poor":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}

export default function DebugDashboardPage() {
  const [metrics, setMetrics] = useState<WebVitalsMetric[]>([]);
  const [errors, setErrors] = useState<DebugError[]>([]);
  const [slowRequests, setSlowRequests] = useState<SlowRequest[]>([]);
  const [showNonDevBanner, setShowNonDevBanner] = useState(false);

  const refresh = () => {
    setMetrics(getMetrics());
    setErrors(getErrors());
    setSlowRequests(getSlowRequests());
  };

  useEffect(() => {
    refresh();
    const unsub = subscribe(refresh);
    const interval = setInterval(refresh, 2000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const isDev =
      typeof window !== "undefined" &&
      (window.location.hostname === "yibaverified.co.za" || window.location.hostname === "127.0.0.1");
    setShowNonDevBanner(!isDev);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Debug Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear all
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/">Back to app</a>
            </Button>
          </div>
        </div>

        {showNonDevBanner && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            This page is for debugging speed and errors. Use in development to find slow loads and
            catch client-side errors before they affect users.
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Core Web Vitals (last 100)</CardTitle>
            <p className="text-sm text-muted-foreground">
              TTFB, FCP, LCP, CLS, INP. Poor ratings are the main culprits for slow or janky UX.
            </p>
          </CardHeader>
          <CardContent>
            {metrics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No metrics yet. Navigate the app and come back; metrics are reported on page load
                and route changes.
              </p>
            ) : (
              <div className="space-y-2">
                {[...metrics].reverse().map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{m.name}</span>
                    <span className={ratingColor(m.rating)}>{m.rating}</span>
                    <span className="text-muted-foreground">
                      {m.name === "CLS" ? m.value.toFixed(3) : formatMs(m.value)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client errors (last 100)</CardTitle>
            <p className="text-sm text-muted-foreground">
              window.error and unhandled promise rejections.
            </p>
          </CardHeader>
          <CardContent>
            {errors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No errors recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {[...errors].reverse().map((e) => (
                  <div
                    key={e.id}
                    className="rounded border border-red-200 bg-red-50/50 p-3 text-sm dark:border-red-900 dark:bg-red-950/20"
                  >
                    <p className="font-medium text-red-800 dark:text-red-200">{e.message}</p>
                    {e.source && (
                      <p className="mt-1 text-xs text-muted-foreground">{e.source}</p>
                    )}
                    {e.stack && (
                      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all text-xs text-muted-foreground">
                        {e.stack}
                      </pre>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(e.timestamp).toLocaleTimeString()} · {e.type}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Slow requests (≥3s, last 100)</CardTitle>
            <p className="text-sm text-muted-foreground">
              fetch() calls that took 3 seconds or more — likely culprits for slow pages.
            </p>
          </CardHeader>
          <CardContent>
            {slowRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No slow requests yet. Requests are tracked after the reporter is mounted.
              </p>
            ) : (
              <div className="space-y-2">
                {[...slowRequests].reverse().map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950/20"
                  >
                    <span className="font-medium">{r.method}</span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground" title={r.url}>
                      {r.url}
                    </span>
                    <span className="text-amber-700 dark:text-amber-300">
                      {formatMs(r.durationMs)}
                    </span>
                    {r.status != null && (
                      <span className="text-muted-foreground">{r.status}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Tip: Open this page in a separate tab and use the app; metrics and errors will appear
          here. Server-side errors are logged in the terminal (see instrumentation.ts).
        </p>
      </div>
    </div>
  );
}

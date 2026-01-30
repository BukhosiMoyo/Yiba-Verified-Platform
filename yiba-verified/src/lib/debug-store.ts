/**
 * Client-side debug store for performance metrics and errors.
 * Only imported by client components; used by the debug dashboard and reporters.
 *
 * Uses a global singleton in the browser so the reporter and dashboard share the
 * same store even when loaded from different chunks (avoids "nothing reported").
 */

const MAX_ITEMS = 100;

const GLOBAL_KEY = "__YIBA_DEBUG_STORE__";

export type WebVitalsMetric = {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating: "good" | "needs-improvement" | "poor";
  navigationType: string;
  timestamp: number;
};

export type DebugError = {
  id: string;
  message: string;
  source?: string;
  stack?: string;
  timestamp: number;
  type: "error" | "unhandledrejection";
};

export type SlowRequest = {
  id: string;
  url: string;
  method: string;
  durationMs: number;
  status?: number;
  timestamp: number;
};

type Listener = () => void;

function getStore() {
  const isBrowser = typeof window !== "undefined";
  if (!isBrowser) {
    return {
      metrics: [] as WebVitalsMetric[],
      errors: [] as DebugError[],
      slowRequests: [] as SlowRequest[],
      listeners: [] as Listener[],
    };
  }
  const g = globalThis as Record<string, unknown>;
  let store = g[GLOBAL_KEY] as
    | {
        metrics: WebVitalsMetric[];
        errors: DebugError[];
        slowRequests: SlowRequest[];
        listeners: Listener[];
      }
    | undefined;
  if (!store) {
    store = {
      metrics: [],
      errors: [],
      slowRequests: [],
      listeners: [],
    };
    g[GLOBAL_KEY] = store;
  }
  return store;
}

const store = getStore();
const metrics = store.metrics;
const errors = store.errors;
const slowRequests = store.slowRequests;
const listeners = store.listeners;

let nextId = 1;
function genId() {
  return `debug-${Date.now()}-${nextId++}`;
}

function trim<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  return arr.slice(-max);
}

export function addMetric(metric: Omit<WebVitalsMetric, "id" | "timestamp">) {
  metrics.push({
    ...metric,
    id: genId(),
    timestamp: Date.now(),
  });
  const trimmed = trim(metrics, MAX_ITEMS);
  metrics.length = 0;
  metrics.push(...trimmed);
  listeners.forEach((cb) => cb());
}

export function addError(error: Omit<DebugError, "id" | "timestamp">) {
  errors.push({
    ...error,
    id: genId(),
    timestamp: Date.now(),
  });
  const trimmed = trim(errors, MAX_ITEMS);
  errors.length = 0;
  errors.push(...trimmed);
  listeners.forEach((cb) => cb());
}

export function addSlowRequest(request: Omit<SlowRequest, "id" | "timestamp">) {
  slowRequests.push({
    ...request,
    id: genId(),
    timestamp: Date.now(),
  });
  const trimmed = trim(slowRequests, MAX_ITEMS);
  slowRequests.length = 0;
  slowRequests.push(...trimmed);
  listeners.forEach((cb) => cb());
}

export function getMetrics(): WebVitalsMetric[] {
  return [...metrics];
}

export function getErrors(): DebugError[] {
  return [...errors];
}

export function getSlowRequests(): SlowRequest[] {
  return [...slowRequests];
}

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function clearAll() {
  metrics.length = 0;
  errors.length = 0;
  slowRequests.length = 0;
  listeners.forEach((cb) => cb());
}

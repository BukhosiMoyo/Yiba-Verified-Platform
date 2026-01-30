/**
 * Next.js instrumentation: runs once when the server starts and on each request error.
 * Use for server-side observability (errors, slow requests) and to integrate with
 * external monitoring (e.g. Sentry). In dev, errors are logged to the console with
 * request context.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Optional: start a server-side tracer or connect to your APM here
  }
}

export async function onRequestError(
  error: unknown,
  request: { path: string; method: string; headers: Headers }
) {
  const path = "path" in request ? request.path : "(unknown)";
  const method = "method" in request ? request.method : "(unknown)";
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error("[instrumentation] Server request error:", {
    path,
    method,
    message,
    stack,
  });

  // Optional: send to external service (Sentry, etc.)
  // await sendToSentry({ error, path, method });
}

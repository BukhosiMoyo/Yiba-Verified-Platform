// API response utilities
// Standardized success and error responses
import { NextResponse } from "next/server";
import { AppError, ERROR_CODES } from "./errors";

/**
 * Returns a successful JSON response
 */
export function ok<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Returns an error response based on error type
 * Maps error codes to appropriate HTTP status codes
 */
export function fail(err: unknown): NextResponse {
  // Handle UNAUTHENTICATED (thrown as Error with code property)
  if (err instanceof Error && (err as any).code === ERROR_CODES.UNAUTHENTICATED) {
    return NextResponse.json(
      { error: "Unauthorized", code: ERROR_CODES.UNAUTHENTICATED },
      { status: 401 }
    );
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }

  // Handle unknown errors
  console.error("Unhandled API error:", err);
  return NextResponse.json(
    { error: "Internal server error", code: ERROR_CODES.INTERNAL_ERROR },
    { status: 500 }
  );
}

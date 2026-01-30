// Helper utilities for API route handlers
// Provides common patterns for validation, rate limiting, and error handling

import { NextRequest, NextResponse } from "next/server";
import { validateRouteParamUUID, validateRouteParamsUUID } from "@/lib/security/validation";
import { checkRateLimit, RATE_LIMITS, createRateLimitHeaders } from "./rateLimit";
import { validateRequestSize, MAX_REQUEST_SIZE, MAX_UPLOAD_SIZE } from "./requestLimits";

export { RATE_LIMITS };
import { AppError, ERROR_CODES } from "./errors";
import { fail } from "./response";
import type { ApiContext } from "./context";

/**
 * Options for route handler wrapper
 */
interface RouteHandlerOptions {
  /**
   * Rate limit configuration (default: STANDARD)
   */
  rateLimit?: typeof RATE_LIMITS[keyof typeof RATE_LIMITS];
  /**
   * Maximum request size in bytes (default: 10MB)
   */
  maxRequestSize?: number;
  /**
   * UUID parameter names to validate
   */
  uuidParams?: string[];
  /**
   * Whether to require authentication (default: true)
   */
  requireAuth?: boolean;
}

/**
 * Extract and validate UUID parameters from route params
 * Returns validated UUIDs as an object
 */
export async function extractAndValidateUUIDs<T extends Record<string, string | undefined | null>>(
  params: Promise<T>,
  paramNames: string[]
): Promise<{ [K in keyof T]: string }> {
  const rawParams = await params;
  return validateRouteParamsUUID(rawParams, paramNames as (keyof T)[]);
}

/**
 * Apply rate limiting to a request
 * Returns rate limit headers and throws if rate limit exceeded
 */
export function applyRateLimit(
  request: NextRequest,
  config: typeof RATE_LIMITS[keyof typeof RATE_LIMITS],
  userId?: string
): Record<string, string> {
  const result = checkRateLimit(request, config, userId);

  if (!result.allowed) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "Rate limit exceeded. Please try again later.",
      429 // Too Many Requests
    );
  }

  return createRateLimitHeaders(result.remaining, result.resetAt);
}

/**
 * Validate request size
 * Throws AppError if request is too large
 */
export async function enforceRequestSizeLimit(
  request: NextRequest,
  maxSize: number = MAX_REQUEST_SIZE
): Promise<void> {
  await validateRequestSize(request, maxSize);
}

/**
 * Common pattern: Extract UUID param from route
 * Validates UUID format and returns the validated value
 */
export async function extractUUIDParam(
  params: Promise<{ [key: string]: string | undefined | null }>,
  paramName: string
): Promise<string> {
  const rawParams = await params;
  const value = rawParams[paramName];
  return validateRouteParamUUID(value, paramName);
}

/**
 * Common pattern: Extract multiple UUID params
 */
export async function extractUUIDParams<T extends Record<string, string | undefined | null>>(
  params: Promise<T>,
  paramNames: (keyof T)[]
): Promise<{ [K in keyof T]: string }> {
  const rawParams = await params;
  return validateRouteParamsUUID(rawParams, paramNames);
}

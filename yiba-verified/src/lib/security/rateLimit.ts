// Rate limiting utilities
// Prevents abuse and DDoS attacks by limiting request frequency

import { NextRequest, NextResponse } from "next/server";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator (default: IP + path)
  skipOnSuccess?: boolean; // Skip rate limit check if request succeeds
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for development/single-instance)
// For production with multiple instances, use Redis or similar
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 60000); // Clean up every minute

/**
 * Rate limit middleware factory
 */
export function createRateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Generate key for rate limiting (IP + path by default)
    const key = keyGenerator
      ? keyGenerator(request)
      : `${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}-${request.nextUrl.pathname}`;

    const now = Date.now();
    const entry = rateLimitStore[key];

    // Check if entry exists and is still valid
    if (entry && entry.resetTime > now) {
      // Entry exists and window hasn't expired
      if (entry.count >= maxRequests) {
        // Rate limit exceeded
        return NextResponse.json(
          {
            error: "Too many requests",
            code: "RATE_LIMIT_EXCEEDED",
            message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
            retryAfter: Math.ceil((entry.resetTime - now) / 1000),
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
              "Retry-After": Math.ceil((entry.resetTime - now) / 1000).toString(),
            },
          }
        );
      }

      // Increment counter
      entry.count += 1;
    } else {
      // Create new entry or reset expired one
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    }

    // Add rate limit headers to response
    const currentEntry = rateLimitStore[key];
    const remaining = Math.max(0, maxRequests - currentEntry.count);

    // Return null to continue (rate limit not exceeded)
    // The headers will be added by a wrapper function
    return null;
  };
}

/**
 * Common rate limit configurations
 */
export const RateLimits = {
  // Strict rate limit for authentication endpoints
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
    keyGenerator: (req) => {
      // Rate limit by IP for auth endpoints
      return `auth-${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}`;
    },
  }),

  // Standard API rate limit
  api: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  }),

  // Strict rate limit for mutations (create/update/delete)
  mutation: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 mutations per minute
  }),

  // Very strict rate limit for file uploads
  upload: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  }),

  // Lenient rate limit for read operations
  read: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 reads per minute
  }),
};

/**
 * Rate limit wrapper for API route handlers
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  rateLimit: (req: NextRequest) => Promise<NextResponse | null> = RateLimits.api
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResponse = await rateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Execute handler
    const response = await handler(req);

    // Add rate limit headers if they exist
    const currentEntry = rateLimitStore[
      `${req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"}-${req.nextUrl.pathname}`
    ];

    if (currentEntry) {
      const maxRequests = 60; // Default, should match the rate limit config
      const remaining = Math.max(0, maxRequests - currentEntry.count);

      response.headers.set("X-RateLimit-Limit", maxRequests.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set("X-RateLimit-Reset", new Date(currentEntry.resetTime).toISOString());
    }

    return response;
  };
}

// Rate limiting utilities for API routes
// Simple in-memory rate limiter (for production, consider Redis-based solution)

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// In-memory store (clears on server restart)
// For production with multiple instances, use Redis or similar
const store: RateLimitStore = {};

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetAt < now) {
        delete store[key];
      }
    }
  }, 60000); // Clean up every minute
}

/**
 * Get client identifier for rate limiting
 * Uses IP address or user ID if available
 */
function getClientId(request: Request, userId?: string): string {
  // Prefer user ID if available (more accurate for authenticated users)
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}

/**
 * Check if request should be rate limited
 * @param request The incoming request
 * @param config Rate limit configuration
 * @param userId Optional user ID for user-based rate limiting
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
  userId?: string
): { allowed: boolean; remaining: number; resetAt: number } {
  const clientId = getClientId(request, userId);
  const now = Date.now();

  let entry = store[clientId];

  // Initialize or reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    store[clientId] = entry;
  }

  // Increment count
  entry.count += 1;

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Standard rate limit configurations
 */
export const RATE_LIMITS = {
  // Strict limits for sensitive operations
  STRICT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  // Standard API limits
  STANDARD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Generous limits for read operations
  GENEROUS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120, // 120 requests per minute
  },
  // Auth endpoints (login, signup, etc.)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
} as const;

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": new Date(resetAt).toISOString(),
  };
}

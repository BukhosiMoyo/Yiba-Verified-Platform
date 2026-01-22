// Request size and payload limits for API routes
import { NextRequest } from "next/server";
import { AppError, ERROR_CODES } from "./errors";
import { fail } from "./response";

/**
 * Maximum request body size (in bytes)
 * Default: 10MB (suitable for most API operations)
 */
export const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Maximum request body size for file uploads
 */
export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Maximum URL length
 */
export const MAX_URL_LENGTH = 2048; // Standard browser limit

/**
 * Check request size and validate limits
 * @throws AppError if request exceeds limits
 */
export async function validateRequestSize(
  request: NextRequest,
  maxSize: number = MAX_REQUEST_SIZE
): Promise<void> {
  const contentLength = request.headers.get("content-length");

  // Check Content-Length header if available
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (isNaN(size) || size > maxSize) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Request body too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
        413 // Payload Too Large
      );
    }
  }

  // Check URL length
  const url = request.url;
  if (url.length > MAX_URL_LENGTH) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      "Request URL too long",
      414 // URI Too Long
    );
  }
}

/**
 * Wrapper for API route handlers that enforces request size limits
 * Use this for routes that accept request bodies
 */
export function withRequestSizeLimit<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  maxSize: number = MAX_REQUEST_SIZE
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      await validateRequestSize(request, maxSize);
      return handler(request, ...args);
    } catch (error) {
      if (error instanceof AppError) {
        return fail(error);
      }
      throw error;
    }
  };
}

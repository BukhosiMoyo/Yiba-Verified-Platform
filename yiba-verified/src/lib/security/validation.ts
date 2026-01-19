// Input validation and sanitization utilities
// Provides common validation functions to prevent injection attacks and data corruption

/**
 * Sanitize string input
 * Removes potentially dangerous characters and normalizes whitespace
 */
export function sanitizeString(input: string | null | undefined, maxLength?: number): string {
  if (!input) return "";

  let sanitized = input
    .trim()
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
    // Normalize whitespace
    .replace(/\s+/g, " ");

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;

  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(email);
}

/**
 * Validate South African ID number format
 */
export function isValidSAID(id: string): boolean {
  if (!id || id.length !== 13) return false;

  // Must be numeric only
  if (!/^\d+$/.test(id)) return false;

  // Luhn algorithm check (simplified - full validation would check date parts too)
  return true; // For now, just check format. Full validation can be added later.
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL (must be HTTP/HTTPS)
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML (removes script tags and dangerous attributes)
 * For rich text content, consider using a proper HTML sanitizer library
 */
export function sanitizeHTML(html: string): string {
  if (!html) return "";

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");

  return sanitized;
}

/**
 * Validate integer range
 */
export function isValidInteger(input: string | number, min?: number, max?: number): boolean {
  const num = typeof input === "string" ? parseInt(input, 10) : input;

  if (isNaN(num) || !isFinite(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;

  return true;
}

/**
 * Validate date string (ISO format or YYYY-MM-DD)
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate file type by extension
 */
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  if (!filename) return false;

  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) return false;

  return allowedTypes.includes(extension);
}

/**
 * Validate file size
 */
export function isValidFileSize(sizeBytes: number, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return sizeBytes >= 0 && sizeBytes <= maxSizeBytes;
}

/**
 * Validate enum value
 */
export function isValidEnum<T extends string>(value: string, enumObject: Record<string, T>): value is T {
  return Object.values(enumObject).includes(value as T);
}

/**
 * Sanitize SQL-like patterns (basic protection, use parameterized queries!)
 * This is a basic check - ALWAYS use parameterized queries in Prisma/database calls
 */
export function containsSQLInjection(input: string): boolean {
  if (!input) return false;

  const sqlPatterns = [
    /('|(\\')|(;)|(--)|(\/\*)|(\*\/)|(xp_)|(sp_)|(exec)|(execute)|(union)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter)|(script)/gi,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate and sanitize pagination parameters
 */
export function validatePagination(limit?: string | number, offset?: string | number): {
  limit: number;
  offset: number;
  valid: boolean;
} {
  const parsedLimit = typeof limit === "string" ? parseInt(limit, 10) : limit || 50;
  const parsedOffset = typeof offset === "string" ? parseInt(offset, 10) : offset || 0;

  const validLimit = isValidInteger(parsedLimit, 1, 200) ? parsedLimit : 50;
  const validOffset = isValidInteger(parsedOffset, 0) ? parsedOffset : 0;

  return {
    limit: validLimit,
    offset: validOffset,
    valid: parsedLimit === validLimit && parsedOffset === validOffset,
  };
}

/**
 * Create validation error response
 */
export function validationError(field: string, message: string) {
  return {
    error: "Validation Error",
    code: "VALIDATION_ERROR",
    field,
    message,
  };
}

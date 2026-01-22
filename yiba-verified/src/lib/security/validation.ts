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
    new RegExp(
      "('|(\\\\')|(;)|(--)|(/\\*)|(\\*/)|(xp_)|(sp_)|(exec)|(execute)|(union)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter)|(script)",
      "gi"
    ),
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

/**
 * Validate route parameter as UUID
 * Returns the UUID if valid, throws AppError if invalid
 * This prevents invalid IDs from reaching the database and provides consistent error handling
 * 
 * @throws AppError with VALIDATION_ERROR code and 400 status if invalid
 */
export function validateRouteParamUUID(
  param: string | undefined | null,
  paramName: string = "id"
): string {
  // Import here to avoid circular dependencies
  const { AppError, ERROR_CODES } = require("@/lib/api/errors");
  
  if (!param || typeof param !== "string") {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Invalid ${paramName}: parameter is required`, 400);
  }

  if (!isValidUUID(param)) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Invalid ${paramName}: must be a valid UUID`, 400);
  }

  return param;
}

/**
 * Validate multiple route parameters as UUIDs
 * Returns an object with validated UUIDs
 * 
 * @throws AppError with VALIDATION_ERROR code and 400 status if any parameter is invalid
 */
export function validateRouteParamsUUID<T extends Record<string, string | undefined | null>>(
  params: T,
  paramNames: (keyof T)[]
): { [K in keyof T]: string } {
  const validated: any = {};

  for (const paramName of paramNames) {
    const param = params[paramName];
    validated[paramName] = validateRouteParamUUID(param as string, paramName as string);
  }

  return validated;
}

/**
 * Province validation utilities
 */
import { PROVINCES } from "@/lib/provinces";

/**
 * Validate province name (must be one of the valid South African provinces)
 */
export function isValidProvince(province: string | null | undefined): boolean {
  if (!province) return false;
  return PROVINCES.includes(province as any);
}

/**
 * Validate province assignment for a user role
 * 
 * Rules:
 * - QCTO_SUPER_ADMIN: default_province is optional (can be national)
 * - QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER: default_province is REQUIRED
 * - default_province must be in assigned_provinces array
 * - All provinces in assigned_provinces must be valid
 * 
 * @throws AppError with VALIDATION_ERROR code and 400 status if validation fails
 */
export function validateProvinceAssignment(
  role: string,
  defaultProvince: string | null | undefined,
  assignedProvinces: string[] | null | undefined
): void {
  const { AppError, ERROR_CODES } = require("@/lib/api/errors");
  
  const QCTO_ROLES_REQUIRING_PROVINCE = [
    "QCTO_ADMIN",
    "QCTO_USER",
    "QCTO_REVIEWER",
    "QCTO_AUDITOR",
    "QCTO_VIEWER",
  ];
  
  const assigned = assignedProvinces || [];
  
  // Validate all assigned provinces are valid
  for (const province of assigned) {
    if (!isValidProvince(province)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid province: ${province}. Must be one of: ${PROVINCES.join(", ")}`,
        400
      );
    }
  }
  
  // QCTO roles (except QCTO_SUPER_ADMIN) require default_province
  if (QCTO_ROLES_REQUIRING_PROVINCE.includes(role)) {
    if (!defaultProvince) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Role ${role} requires a default_province`,
        400
      );
    }
    
    if (!isValidProvince(defaultProvince)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid default_province: ${defaultProvince}. Must be one of: ${PROVINCES.join(", ")}`,
        400
      );
    }
    
    // default_province must be in assigned_provinces array
    if (!assigned.includes(defaultProvince)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `default_province (${defaultProvince}) must be included in assigned_provinces array`,
        400
      );
    }
  }
  
  // If default_province is provided, it must be in assigned_provinces
  if (defaultProvince && !assigned.includes(defaultProvince)) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      `default_province (${defaultProvince}) must be included in assigned_provinces array`,
      400
    );
  }
}

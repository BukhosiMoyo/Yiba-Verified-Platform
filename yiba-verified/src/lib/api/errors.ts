// API error types
// Standardized error handling for API routes

export class AppError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

// Common error codes
export const ERROR_CODES = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  QCTO_READ_ONLY: "QCTO_READ_ONLY",
  INSTITUTION_SCOPE_VIOLATION: "INSTITUTION_SCOPE_VIOLATION",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const;

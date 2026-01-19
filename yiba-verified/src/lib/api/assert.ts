// RBAC assertion utilities
// Enforces access control and scope checks
import { AppError, ERROR_CODES } from "./errors";
import type { ApiContext } from "./context";
import type { Role } from "@/lib/rbac";

/**
 * Asserts a condition, throwing AppError if false
 */
export function assert(
  condition: boolean,
  code: string,
  message: string,
  status: number = 403
): asserts condition {
  if (!condition) {
    throw new AppError(code, message, status);
  }
}

/**
 * Asserts that the user has institution scope for the given entity.
 * Deny-by-default: Institution roles can ONLY access their own institution's data.
 * PLATFORM_ADMIN can access everything (but still audited).
 * STUDENT must be self-scoped (checked separately via Learner.user_id).
 */
export function assertInstitutionScope(
  ctx: ApiContext,
  entityInstitutionId: string | null
): void {
  // PLATFORM_ADMIN can access everything
  if (ctx.role === "PLATFORM_ADMIN") {
    return;
  }

  // Institution roles must match their institution
  if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
    if (!ctx.institutionId) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "User has no institution association",
        403
      );
    }
    if (entityInstitutionId !== ctx.institutionId) {
      throw new AppError(
        ERROR_CODES.INSTITUTION_SCOPE_VIOLATION,
        "Access denied: institution scope violation",
        403
      );
    }
    return;
  }

  // QCTO and STUDENT cannot access institution-scoped entities directly
  // (QCTO can only read, STUDENT must use self-scoping)
  throw new AppError(
    ERROR_CODES.FORBIDDEN,
    "Access denied: insufficient permissions",
    403
  );
}

/**
 * Asserts that QCTO users cannot edit institution-submitted data.
 * QCTO can only write to review-only models:
 * - EvidenceFlag
 * - ReviewComment
 * - ReadinessRecommendation
 */
export function assertNotQCTOEdit(ctx: ApiContext, entityType: string): void {
  if (ctx.role === "QCTO_USER") {
    const reviewOnlyModels = ["EvidenceFlag", "ReviewComment", "ReadinessRecommendation"];
    if (!reviewOnlyModels.includes(entityType)) {
      throw new AppError(
        ERROR_CODES.QCTO_READ_ONLY,
        "QCTO users cannot edit institution-submitted data",
        403
      );
    }
  }
}

/**
 * Asserts that a student can only access their own learner record.
 * Must be called with the learner's user_id already fetched.
 */
export function assertStudentSelfScope(
  ctx: ApiContext,
  learnerUserId: string | null
): void {
  if (ctx.role === "STUDENT") {
    if (learnerUserId !== ctx.userId) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Students can only access their own records",
        403
      );
    }
  }
}

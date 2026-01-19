// QCTO access control helpers
// Implements submission/request-based QCTO access model
// QCTO can only see resources that are:
// 1. Linked to APPROVED submissions (institutions submitted them)
// 2. Linked to APPROVED QCTORequests (QCTO requested, institution approved)
//
// PLATFORM_ADMIN always has access (app owners see everything! 🦸)
// Deny-by-default: if resource isn't explicitly shared/approved, QCTO can't see it.

import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "./errors";
import type { ApiContext } from "./context";

export type QCTOResourceType = 
  | "READINESS"
  | "LEARNER"
  | "ENROLMENT"
  | "DOCUMENT"
  | "INSTITUTION";

/**
 * Checks if QCTO can read a resource (submission/request-based access).
 * 
 * Rules:
 * - PLATFORM_ADMIN: always returns true (app owners see everything! 🦸)
 * - QCTO_USER: returns true only if resource is in:
 *   a) APPROVED Submission (institution submitted it)
 *   b) APPROVED QCTORequest (QCTO requested, institution approved)
 * - Other roles: returns false (they have their own access patterns)
 * 
 * @param ctx ApiContext - must be QCTO_USER or PLATFORM_ADMIN
 * @param resourceType Type of resource (READINESS, LEARNER, ENROLMENT, DOCUMENT, INSTITUTION)
 * @param resourceId The actual ID of the resource (readiness_id, learner_id, etc.)
 * @returns Promise<boolean> - true if QCTO can access, false otherwise
 */
export async function canReadForQCTO(
  ctx: ApiContext,
  resourceType: QCTOResourceType,
  resourceId: string
): Promise<boolean> {
  // PLATFORM_ADMIN always has access (app owners see everything! 🦸)
  if (ctx.role === "PLATFORM_ADMIN") {
    return true;
  }

  // Only QCTO_USER should use this function (others have their own access patterns)
  if (ctx.role !== "QCTO_USER") {
    return false;
  }

  // Check if resource is in an APPROVED submission
  const approvedSubmission = await prisma.submissionResource.findFirst({
    where: {
      resource_type: resourceType,
      resource_id_value: resourceId,
      submission: {
        status: "APPROVED",
        deleted_at: null,
      },
    },
    select: {
      resource_id: true,
    },
  });

  if (approvedSubmission) {
    return true; // Resource is in an approved submission - QCTO can see it! ✅
  }

  // Check if resource is in a SUBMITTED or UNDER_REVIEW submission (QCTO needs to view while reviewing)
  const pendingSubmission = await prisma.submissionResource.findFirst({
    where: {
      resource_type: resourceType,
      resource_id_value: resourceId,
      submission: {
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
        deleted_at: null,
      },
    },
    select: {
      resource_id: true,
    },
  });

  if (pendingSubmission) {
    return true; // Resource is in a submission being reviewed - QCTO can see it! ✅
  }

  // Check if resource is in an APPROVED QCTORequest
  // Note: After migration, verify the Prisma client model name (might be qCTORequestResource or qctoRequestResource)
  const approvedRequest = await prisma.qCTORequestResource.findFirst({
    where: {
      resource_type: resourceType,
      resource_id_value: resourceId,
      request: {
        status: "APPROVED",
        deleted_at: null,
      },
    },
    select: {
      resource_id: true,
    },
  });

  if (approvedRequest) {
    return true; // Resource is in an approved request - QCTO can see it! ✅
  }

  // Resource not shared/approved - QCTO can't see it (deny-by-default)
  return false;
}

/**
 * Asserts that QCTO can read a resource, throwing AppError if not.
 * 
 * This is the assertion version - throws error instead of returning boolean.
 * Use this in API routes when you want automatic error handling.
 * 
 * @param ctx ApiContext - must be QCTO_USER or PLATFORM_ADMIN
 * @param resourceType Type of resource (READINESS, LEARNER, ENROLMENT, DOCUMENT, INSTITUTION)
 * @param resourceId The actual ID of the resource (readiness_id, learner_id, etc.)
 * @throws AppError with FORBIDDEN if QCTO cannot access the resource
 */
export async function assertCanReadForQCTO(
  ctx: ApiContext,
  resourceType: QCTOResourceType,
  resourceId: string
): Promise<void> {
  // PLATFORM_ADMIN always has access (app owners see everything! 🦸)
  if (ctx.role === "PLATFORM_ADMIN") {
    return;
  }

  // Only QCTO_USER should use this function
  if (ctx.role !== "QCTO_USER") {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      "This function is only for QCTO access checks. Other roles have their own access patterns.",
      403
    );
  }

  const canRead = await canReadForQCTO(ctx, resourceType, resourceId);

  if (!canRead) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      `Access denied: This ${resourceType.toLowerCase()} has not been shared with QCTO via an approved submission or request.`,
      403
    );
  }
}

/**
 * Helper to check if QCTO can read an institution.
 * 
 * QCTO can read an institution if:
 * - Any resource from that institution is in an APPROVED submission
 * - Any QCTORequest for that institution is APPROVED (even if no resources yet)
 * 
 * This is useful for listing institutions QCTO has access to.
 * 
 * @param ctx ApiContext - must be QCTO_USER or PLATFORM_ADMIN
 * @param institutionId The institution ID
 * @returns Promise<boolean> - true if QCTO can access this institution
 */
export async function canReadInstitutionForQCTO(
  ctx: ApiContext,
  institutionId: string
): Promise<boolean> {
  // PLATFORM_ADMIN always has access (app owners see everything! 🦸)
  if (ctx.role === "PLATFORM_ADMIN") {
    return true;
  }

  if (ctx.role !== "QCTO_USER") {
    return false;
  }

  // Check if institution has any APPROVED submissions
  const hasApprovedSubmission = await prisma.submission.findFirst({
    where: {
      institution_id: institutionId,
      status: "APPROVED",
      deleted_at: null,
    },
    select: {
      submission_id: true,
    },
  });

  if (hasApprovedSubmission) {
    return true; // Institution has approved submissions - QCTO can see it! ✅
  }

  // Check if institution has any APPROVED QCTORequests
  // Note: After migration, verify the Prisma client model name (might be qCTORequest or qctoRequest)
  const hasApprovedRequest = await prisma.qCTORequest.findFirst({
    where: {
      institution_id: institutionId,
      status: "APPROVED",
      deleted_at: null,
    },
    select: {
      request_id: true,
    },
  });

  if (hasApprovedRequest) {
    return true; // Institution has approved requests - QCTO can see it! ✅
  }

  // Institution not shared/approved - QCTO can't see it (deny-by-default)
  return false;
}

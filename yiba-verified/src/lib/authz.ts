// Authorization service - enforce deny-by-default RBAC with institution scoping
// This file implements fine-grained authorization checks beyond route-level access

import type { UserRole } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

export type AuthzContext = {
  userId: string;
  role: UserRole;
  institutionId: string | null;
};

/**
 * Authorization result
 */
export type AuthzResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Deny-by-default authorization check
 * Returns false unless explicitly allowed
 */
export function denyByDefault(): AuthzResult {
  return { allowed: false, reason: "Access denied by default" };
}

/**
 * Check if user can access an institution's data
 * Institution users can only access their own institution's data
 * Platform Admin and QCTO can access all institutions
 */
export function canAccessInstitution(
  context: AuthzContext,
  targetInstitutionId: string | null
): AuthzResult {
  // Platform Admin has full access
  if (context.role === "PLATFORM_ADMIN") {
    return { allowed: true };
  }

  // QCTO has read-only access to all institutions
  if (context.role === "QCTO_USER") {
    return { allowed: true };
  }

  // Institution users must match their institution
  if (context.role === "INSTITUTION_ADMIN" || context.role === "INSTITUTION_STAFF") {
    if (!context.institutionId) {
      return { allowed: false, reason: "User has no institution assigned" };
    }
    if (targetInstitutionId !== context.institutionId) {
      return {
        allowed: false,
        reason: `User institution (${context.institutionId}) does not match target institution (${targetInstitutionId})`,
      };
    }
    return { allowed: true };
  }

  // Students cannot access institution data
  return { allowed: false, reason: "Students cannot access institution data" };
}

/**
 * Check if user can access a learner record
 * Students can only access their own learner record
 * Institution users can access learners in their institution
 * Platform Admin and QCTO can access all learners
 */
export async function canAccessLearner(
  context: AuthzContext,
  learnerId: string,
  prisma: PrismaClient
): Promise<AuthzResult> {
  // Platform Admin has full access
  if (context.role === "PLATFORM_ADMIN") {
    return { allowed: true };
  }

  // QCTO has read-only access to all learners
  if (context.role === "QCTO_USER") {
    return { allowed: true };
  }

  // Students can only access their own learner record (via user_id link)
  if (context.role === "STUDENT") {
    const learner = await prisma.learner.findUnique({
      where: { learner_id: learnerId },
      select: { learner_id: true, user_id: true },
    });

    if (!learner) {
      return { allowed: false, reason: "Learner not found" };
    }

    // Check if learner is linked to this student user
    if (learner.user_id !== context.userId) {
      return {
        allowed: false,
        reason: "Students can only access their own learner record",
      };
    }

    return { allowed: true };
  }

  // Institution users can access learners in their institution
  if (context.role === "INSTITUTION_ADMIN" || context.role === "INSTITUTION_STAFF") {
    if (!context.institutionId) {
      return { allowed: false, reason: "User has no institution assigned" };
    }

    const learner = await prisma.learner.findUnique({
      where: { learner_id: learnerId },
      select: { institution_id: true },
    });

    if (!learner) {
      return { allowed: false, reason: "Learner not found" };
    }

    if (learner.institution_id !== context.institutionId) {
      return {
        allowed: false,
        reason: `Learner belongs to institution ${learner.institution_id}, user belongs to ${context.institutionId}`,
      };
    }

    return { allowed: true };
  }

  return denyByDefault();
}

/**
 * Check if user can edit data (QCTO is read-only except for review actions)
 * QCTO users cannot edit institution-submitted data
 */
export function canEdit(
  context: AuthzContext,
  entityType: "institution" | "learner" | "readiness" | "enrolment" | "document"
): AuthzResult {
  // QCTO is read-only for all entity types except review actions
  // Review actions (flag, recommend) are handled separately via capabilities
  if (context.role === "QCTO_USER") {
    return {
      allowed: false,
      reason: "QCTO users are read-only and cannot edit institution-submitted data",
    };
  }

  // Platform Admin can edit (but still generates audit logs)
  if (context.role === "PLATFORM_ADMIN") {
    return { allowed: true };
  }

  // Institution users can edit within their scope (enforced by canAccessInstitution)
  if (context.role === "INSTITUTION_ADMIN" || context.role === "INSTITUTION_STAFF") {
    return { allowed: true };
  }

  // Students cannot edit
  if (context.role === "STUDENT") {
    return { allowed: false, reason: "Students cannot edit data" };
  }

  return denyByDefault();
}

/**
 * Check if staff user can access a specific resource (assigned-only check)
 * This is a placeholder for future assignment-based permissions
 * For now, returns true if user is in the same institution
 */
export async function canAccessAssignedResource(
  context: AuthzContext,
  resourceInstitutionId: string,
  resourceId: string,
  resourceType: "readiness" | "learner" | "enrolment"
): Promise<AuthzResult> {
  // Only applies to INSTITUTION_STAFF
  if (context.role !== "INSTITUTION_STAFF") {
    return { allowed: true }; // Other roles handled by other checks
  }

  if (!context.institutionId) {
    return { allowed: false, reason: "User has no institution assigned" };
  }

  // Institution must match
  if (resourceInstitutionId !== context.institutionId) {
    return {
      allowed: false,
      reason: `Resource belongs to institution ${resourceInstitutionId}, user belongs to ${context.institutionId}`,
    };
  }

  // TODO: Implement assignment-based checks
  // For now, staff can access all resources in their institution
  // Future: Check if staff is assigned to this specific readiness/learner/enrolment
  // This would require an assignment table or field in the resource

  return { allowed: true };
}

/**
 * Check if user can perform QCTO review actions (flag, recommend, etc.)
 * Only QCTO users can perform these actions
 */
export function canPerformQCTOReview(context: AuthzContext): AuthzResult {
  if (context.role === "QCTO_USER") {
    return { allowed: true };
  }

  // Platform Admin might also need review capabilities - clarify with requirements
  // For now, only QCTO can review
  return {
    allowed: false,
    reason: "Only QCTO users can perform review actions",
  };
}

/**
 * Check if user can create EvidenceFlag
 * Only QCTO users can flag evidence
 */
export function canCreateEvidenceFlag(context: AuthzContext): AuthzResult {
  if (context.role === "QCTO_USER") {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "Only QCTO users can flag evidence",
  };
}

/**
 * Check if user can create ReviewComment
 * Only QCTO users can create review comments
 */
export function canCreateReviewComment(context: AuthzContext): AuthzResult {
  if (context.role === "QCTO_USER") {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "Only QCTO users can create review comments",
  };
}

/**
 * Check if user can create ReadinessRecommendation
 * Only QCTO users can record recommendations
 */
export function canCreateReadinessRecommendation(context: AuthzContext): AuthzResult {
  if (context.role === "QCTO_USER") {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "Only QCTO users can record readiness recommendations",
  };
}

/**
 * Check if user can access QCTO review data (flags, comments, recommendations)
 * QCTO users can access all review data
 * Institution users can access review data for their own institution
 * Platform Admin can access all review data
 */
export async function canAccessReviewData(
  context: AuthzContext,
  reviewEntityType: "flag" | "comment" | "recommendation",
  reviewEntityId: string,
  prisma: PrismaClient
): Promise<AuthzResult> {
  // Platform Admin has full access
  if (context.role === "PLATFORM_ADMIN") {
    return { allowed: true };
  }

  // QCTO users can access all review data
  if (context.role === "QCTO_USER") {
    return { allowed: true };
  }

  // Institution users can access review data for their own institution
  if (context.role === "INSTITUTION_ADMIN" || context.role === "INSTITUTION_STAFF") {
    if (!context.institutionId) {
      return { allowed: false, reason: "User has no institution assigned" };
    }

    // Resolve institution_id from review entity
    let targetInstitutionId: string | null = null;

    switch (reviewEntityType) {
      case "flag": {
        const flag = await prisma.evidenceFlag.findUnique({
          where: { flag_id: reviewEntityId },
          select: { document: { select: { related_entity: true, related_entity_id: true } } },
        });
        if (!flag) {
          return { allowed: false, reason: "Review data not found" };
        }
        targetInstitutionId = await getInstitutionIdForEntity(
          flag.document.related_entity.toLowerCase() as "learner" | "readiness" | "enrolment" | "document",
          flag.document.related_entity_id,
          prisma
        );
        break;
      }
      case "comment": {
        const comment = await prisma.reviewComment.findUnique({
          where: { comment_id: reviewEntityId },
          select: { related_entity: true, related_entity_id: true },
        });
        if (!comment) {
          return { allowed: false, reason: "Review data not found" };
        }
        targetInstitutionId = await getInstitutionIdForEntity(
          comment.related_entity.toLowerCase() as "learner" | "readiness" | "enrolment" | "document",
          comment.related_entity_id,
          prisma
        );
        break;
      }
      case "recommendation": {
        const recommendation = await prisma.readinessRecommendation.findUnique({
          where: { recommendation_id: reviewEntityId },
          select: { readiness: { select: { institution_id: true } } },
        });
        if (!recommendation) {
          return { allowed: false, reason: "Review data not found" };
        }
        targetInstitutionId = recommendation.readiness.institution_id;
        break;
      }
    }

    if (targetInstitutionId !== context.institutionId) {
      return {
        allowed: false,
        reason: `Review data belongs to institution ${targetInstitutionId}, user belongs to ${context.institutionId}`,
      };
    }

    return { allowed: true };
  }

  // Students cannot access review data
  return { allowed: false, reason: "Students cannot access review data" };
}

/**
 * Get institution ID from context or entity
 * Helper function to extract institution ID for scoping checks
 */
export async function getInstitutionIdForEntity(
  entityType: "learner" | "readiness" | "enrolment" | "document",
  entityId: string,
  prisma: PrismaClient
): Promise<string | null> {
  switch (entityType) {
    case "learner": {
      const learner = await prisma.learner.findUnique({
        where: { learner_id: entityId },
        select: { institution_id: true },
      });
      return learner?.institution_id ?? null;
    }
    case "readiness": {
      const readiness = await prisma.readiness.findUnique({
        where: { readiness_id: entityId },
        select: { institution_id: true },
      });
      return readiness?.institution_id ?? null;
    }
    case "enrolment": {
      const enrolment = await prisma.enrolment.findUnique({
        where: { enrolment_id: entityId },
        select: { institution_id: true },
      });
      return enrolment?.institution_id ?? null;
    }
    case "document": {
      const document = await prisma.document.findUnique({
        where: { document_id: entityId },
        select: { related_entity: true, related_entity_id: true },
      });
      if (!document) return null;

      // Documents can be related to different entities
      // Need to resolve the institution_id from the related entity
      if (document.related_entity === "INSTITUTION") {
        return document.related_entity_id;
      }
      if (document.related_entity === "LEARNER") {
        const learner = await prisma.learner.findUnique({
          where: { learner_id: document.related_entity_id },
          select: { institution_id: true },
        });
        return learner?.institution_id ?? null;
      }
      if (document.related_entity === "READINESS") {
        const readiness = await prisma.readiness.findUnique({
          where: { readiness_id: document.related_entity_id },
          select: { institution_id: true },
        });
        return readiness?.institution_id ?? null;
      }
      if (document.related_entity === "ENROLMENT") {
        const enrolment = await prisma.enrolment.findUnique({
          where: { enrolment_id: document.related_entity_id },
          select: { institution_id: true },
        });
        return enrolment?.institution_id ?? null;
      }
      return null;
    }
    default:
      return null;
  }
}

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
  | "INSTITUTION"
  | "FACILITATOR";

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
/**
 * Helper to get province filter for QCTO user queries
 * Returns array of provinces to filter by, or null if no filtering needed
 */
export async function getProvinceFilterForQCTO(ctx: ApiContext): Promise<string[] | null> {
  // PLATFORM_ADMIN: no province filtering
  if (ctx.role === "PLATFORM_ADMIN") {
    return null; // null means no filtering (see all provinces)
  }

  // QCTO_SUPER_ADMIN: no province filtering (can be national)
  if (ctx.role === "QCTO_SUPER_ADMIN") {
    return null; // null means no filtering (see all provinces)
  }

  // QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER: filter by assigned provinces
  const QCTO_PROVINCE_FILTERED_ROLES = [
    "QCTO_ADMIN",
    "QCTO_USER",
    "QCTO_REVIEWER",
    "QCTO_AUDITOR",
    "QCTO_VIEWER",
  ];

  if (QCTO_PROVINCE_FILTERED_ROLES.includes(ctx.role)) {
    // Get user's assigned provinces
    const user = await prisma.user.findUnique({
      where: { user_id: ctx.userId },
      select: { assigned_provinces: true },
    });

    if (!user || !user.assigned_provinces || user.assigned_provinces.length === 0) {
      // No provinces assigned - return empty array (will filter to nothing)
      return [];
    }

    return user.assigned_provinces;
  }

  return null; // Default: no filtering
}

/**
 * Helper to check if user's assigned provinces match institution's province
 */
async function matchesProvinceFilter(
  ctx: ApiContext,
  institutionProvince: string | null
): Promise<boolean> {
  // PLATFORM_ADMIN: no province filtering
  if (ctx.role === "PLATFORM_ADMIN") {
    return true;
  }

  // QCTO_SUPER_ADMIN: no province filtering (can be national)
  if (ctx.role === "QCTO_SUPER_ADMIN") {
    return true;
  }

  // QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER: check assigned provinces
  const QCTO_PROVINCE_FILTERED_ROLES = [
    "QCTO_ADMIN",
    "QCTO_USER",
    "QCTO_REVIEWER",
    "QCTO_AUDITOR",
    "QCTO_VIEWER",
  ];

  if (QCTO_PROVINCE_FILTERED_ROLES.includes(ctx.role)) {
    // Get user's assigned provinces
    const user = await prisma.user.findUnique({
      where: { user_id: ctx.userId },
      select: { assigned_provinces: true },
    });

    if (!user || !user.assigned_provinces || user.assigned_provinces.length === 0) {
      // No provinces assigned - deny access (shouldn't happen if validation is working)
      return false;
    }

    // If institution has no province, deny (shouldn't happen, but safety check)
    if (!institutionProvince) {
      return false;
    }

    // Check if institution's province is in user's assigned provinces
    return user.assigned_provinces.includes(institutionProvince);
  }

  return false;
}

export async function canReadForQCTO(
  ctx: ApiContext,
  resourceType: QCTOResourceType,
  resourceId: string
): Promise<boolean> {
  // PLATFORM_ADMIN: always has access (no province filtering)
  if (ctx.role === "PLATFORM_ADMIN") {
    return true;
  }

  // QCTO_SUPER_ADMIN: full access (no province filtering)
  if (ctx.role === "QCTO_SUPER_ADMIN") {
    return true;
  }

  // QCTO_ADMIN: full access within their assigned provinces
  if (ctx.role === "QCTO_ADMIN") {
    // Get institution province for province filtering
    let institutionProvince: string | null = null;
    
    if (resourceType === "INSTITUTION") {
      const institution = await prisma.institution.findUnique({
        where: { institution_id: resourceId },
        select: { province: true },
      });
      institutionProvince = institution?.province || null;
    } else {
      // For other resource types, get institution from the resource
      if (resourceType === "READINESS") {
        const readiness = await prisma.readiness.findUnique({
          where: { readiness_id: resourceId },
          include: { institution: { select: { province: true } } },
        });
        institutionProvince = readiness?.institution.province || null;
      } else if (resourceType === "LEARNER") {
        const learner = await prisma.learner.findUnique({
          where: { learner_id: resourceId },
          include: { institution: { select: { province: true } } },
        });
        institutionProvince = learner?.institution.province || null;
      } else if (resourceType === "ENROLMENT") {
        const enrolment = await prisma.enrolment.findUnique({
          where: { enrolment_id: resourceId },
          include: { institution: { select: { province: true } } },
        });
        institutionProvince = enrolment?.institution.province || null;
      } else if (resourceType === "FACILITATOR") {
        const facilitator = await prisma.facilitator.findUnique({
          where: { facilitator_id: resourceId },
          include: { readiness: { include: { institution: { select: { province: true } } } } },
        });
        institutionProvince = facilitator?.readiness.institution.province || null;
      } else if (resourceType === "DOCUMENT") {
        // Documents can be linked to different entities, need to find institution
        const doc = await prisma.document.findUnique({
          where: { document_id: resourceId },
        });
        if (doc?.related_entity === "INSTITUTION") {
          const inst = await prisma.institution.findUnique({
            where: { institution_id: doc.related_entity_id },
            select: { province: true },
          });
          institutionProvince = inst?.province || null;
        } else if (doc?.related_entity === "LEARNER") {
          const learner = await prisma.learner.findUnique({
            where: { learner_id: doc.related_entity_id },
            include: { institution: { select: { province: true } } },
          });
          institutionProvince = learner?.institution.province || null;
        } else if (doc?.related_entity === "ENROLMENT") {
          const enrolment = await prisma.enrolment.findUnique({
            where: { enrolment_id: doc.related_entity_id },
            include: { institution: { select: { province: true } } },
          });
          institutionProvince = enrolment?.institution.province || null;
        } else if (doc?.related_entity === "READINESS") {
          const readiness = await prisma.readiness.findUnique({
            where: { readiness_id: doc.related_entity_id },
            include: { institution: { select: { province: true } } },
          });
          institutionProvince = readiness?.institution.province || null;
        } else if (doc?.related_entity === "FACILITATOR") {
          const facilitator = await prisma.facilitator.findUnique({
            where: { facilitator_id: doc.related_entity_id },
            include: { readiness: { include: { institution: { select: { province: true } } } } },
          });
          institutionProvince = facilitator?.readiness.institution.province || null;
        }
      }
    }

    // Check province match
    return await matchesProvinceFilter(ctx, institutionProvince);
  }

  // Only QCTO_USER uses submission/request-based access below (others have their own patterns)
  if (ctx.role !== "QCTO_USER") {
    return false;
  }

  // QCTO_USER: submission/request-based access + province filtering
  // First, get institution province for province filtering
  let institutionProvince: string | null = null;
  
  if (resourceType === "INSTITUTION") {
    const institution = await prisma.institution.findUnique({
      where: { institution_id: resourceId },
      select: { province: true },
    });
    institutionProvince = institution?.province || null;
  } else {
    // For other resource types, get institution from the resource
    if (resourceType === "READINESS") {
      const readiness = await prisma.readiness.findUnique({
        where: { readiness_id: resourceId },
        include: { institution: { select: { province: true } } },
      });
      institutionProvince = readiness?.institution.province || null;
    } else if (resourceType === "LEARNER") {
      const learner = await prisma.learner.findUnique({
        where: { learner_id: resourceId },
        include: { institution: { select: { province: true } } },
      });
      institutionProvince = learner?.institution.province || null;
    } else if (resourceType === "ENROLMENT") {
      try {
        const enrolment = await prisma.enrolment.findUnique({
          where: { enrolment_id: resourceId },
          include: { institution: { select: { province: true } } },
        });
        institutionProvince = enrolment?.institution?.province ?? null;
      } catch (error) {
        console.error("Error fetching enrolment for province check:", error);
        institutionProvince = null;
      }
    } else if (resourceType === "FACILITATOR") {
      const facilitator = await prisma.facilitator.findUnique({
        where: { facilitator_id: resourceId },
        include: { readiness: { include: { institution: { select: { province: true } } } } },
      });
      institutionProvince = facilitator?.readiness.institution.province || null;
    } else if (resourceType === "DOCUMENT") {
      // Documents can be linked to different entities, need to find institution
      const doc = await prisma.document.findUnique({
        where: { document_id: resourceId },
      });
      if (doc?.related_entity === "INSTITUTION") {
        const inst = await prisma.institution.findUnique({
          where: { institution_id: doc.related_entity_id },
          select: { province: true },
        });
        institutionProvince = inst?.province || null;
      } else if (doc?.related_entity === "LEARNER") {
        const learner = await prisma.learner.findUnique({
          where: { learner_id: doc.related_entity_id },
          include: { institution: { select: { province: true } } },
        });
        institutionProvince = learner?.institution.province || null;
      } else if (doc?.related_entity === "ENROLMENT") {
        const enrolment = await prisma.enrolment.findUnique({
          where: { enrolment_id: doc.related_entity_id },
          include: { institution: { select: { province: true } } },
        });
        institutionProvince = enrolment?.institution.province || null;
      } else if (doc?.related_entity === "READINESS") {
        const readiness = await prisma.readiness.findUnique({
          where: { readiness_id: doc.related_entity_id },
          include: { institution: { select: { province: true } } },
        });
        institutionProvince = readiness?.institution.province || null;
      } else if (doc?.related_entity === "FACILITATOR") {
        const facilitator = await prisma.facilitator.findUnique({
          where: { facilitator_id: doc.related_entity_id },
          include: { readiness: { include: { institution: { select: { province: true } } } } },
        });
        institutionProvince = facilitator?.readiness.institution.province || null;
      }
    }
  }

  // Check province match first (if province doesn't match, deny access)
  const provinceMatches = await matchesProvinceFilter(ctx, institutionProvince);
  if (!provinceMatches) {
    return false; // Province doesn't match - deny access
  }

  // Province matches, now check submission/request access
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

  // Check if resource is in an APPROVED QCTORequest (and not expired)
  const now = new Date();
  const approvedRequest = await prisma.qCTORequestResource.findFirst({
    where: {
      resource_type: resourceType,
      resource_id_value: resourceId,
      request: {
        status: "APPROVED",
        deleted_at: null,
        OR: [
          { expires_at: null },
          { expires_at: { gt: now } },
        ],
      },
    },
    select: {
      resource_id: true,
    },
  });

  if (approvedRequest) {
    return true; // Resource is in an approved, non-expired request - QCTO can see it! ✅
  }

  // Special case: For ENROLMENT resources, also check if the learner is in an approved submission/request
  if (resourceType === "ENROLMENT") {
    try {
      const enrolment = await prisma.enrolment.findUnique({
        where: { enrolment_id: resourceId },
        select: { learner_id: true },
      });

      if (enrolment?.learner_id) {
        // Check if learner is in an approved submission
        const learnerInSubmission = await prisma.submissionResource.findFirst({
          where: {
            resource_type: "LEARNER",
            resource_id_value: enrolment.learner_id,
            submission: {
              status: { in: ["APPROVED", "SUBMITTED", "UNDER_REVIEW"] },
              deleted_at: null,
            },
          },
        });

        if (learnerInSubmission) {
          return true; // Learner is in a submission - QCTO can see their enrolments! ✅
        }

        // Check if learner is in an approved, non-expired request
        const learnerInRequest = await prisma.qCTORequestResource.findFirst({
          where: {
            resource_type: "LEARNER",
            resource_id_value: enrolment.learner_id,
            request: {
              status: "APPROVED",
              deleted_at: null,
              OR: [
                { expires_at: null },
                { expires_at: { gt: now } },
              ],
            },
          },
        });

        if (learnerInRequest) {
          return true; // Learner is in an approved, non-expired request - QCTO can see their enrolments! ✅
        }
      }
    } catch (error) {
      // If there's an error checking learner access, log it but don't fail
      // The enrolment might still be directly accessible
      console.error("Error checking learner access for enrolment:", error);
    }
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
  // PLATFORM_ADMIN: always has access
  if (ctx.role === "PLATFORM_ADMIN") {
    return;
  }

  // QCTO_SUPER_ADMIN: full access (no province filtering)
  if (ctx.role === "QCTO_SUPER_ADMIN") {
    return;
  }

  // QCTO_ADMIN, QCTO_USER, QCTO_REVIEWER, QCTO_AUDITOR, QCTO_VIEWER: check access
  const QCTO_ROLES = [
    "QCTO_ADMIN",
    "QCTO_USER",
    "QCTO_REVIEWER",
    "QCTO_AUDITOR",
    "QCTO_VIEWER",
  ];

  if (!QCTO_ROLES.includes(ctx.role)) {
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
      `Access denied: This ${resourceType.toLowerCase()} is not accessible (may not be shared, approved, or may be from a different province).`,
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
  // PLATFORM_ADMIN: always has access (no province filtering)
  if (ctx.role === "PLATFORM_ADMIN") {
    return true;
  }

  // Get institution province for province filtering
  const institution = await prisma.institution.findUnique({
    where: { institution_id: institutionId },
    select: { province: true },
  });

  const institutionProvince = institution?.province || null;

  // QCTO_SUPER_ADMIN: full access (no province filtering)
  if (ctx.role === "QCTO_SUPER_ADMIN") {
    return true;
  }

  // QCTO_ADMIN: full access within assigned provinces
  if (ctx.role === "QCTO_ADMIN") {
    return await matchesProvinceFilter(ctx, institutionProvince);
  }

  if (ctx.role !== "QCTO_USER") {
    return false;
  }

  // QCTO_USER: check province match first
  const provinceMatches = await matchesProvinceFilter(ctx, institutionProvince);
  if (!provinceMatches) {
    return false; // Province doesn't match - deny access
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
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } },
      ],
    },
    select: {
      request_id: true,
    },
  });

  if (hasApprovedRequest) {
    return true; // Institution has approved, non-expired requests - QCTO can see it! ✅
  }

  // Institution not shared/approved - QCTO can't see it (deny-by-default)
  return false;
}

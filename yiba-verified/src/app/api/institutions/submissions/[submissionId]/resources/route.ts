// POST /api/institutions/submissions/[submissionId]/resources - Add resource to submission
// DELETE /api/institutions/submissions/[submissionId]/resources/[resourceId] - Remove resource from submission
//
// POST Test commands:
//   # With dev token (development only):
//   export BASE_URL="http://localhost:3000"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -X POST "$BASE_URL/api/institutions/submissions/<SUBMISSION_ID>/resources" \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
//     -d '{
//       "resource_type": "LEARNER",
//       "resource_id_value": "<LEARNER_ID>",
//       "notes": "Main learner profile"
//     }'
//
// DELETE Test commands:
//   curl -X DELETE "$BASE_URL/api/institutions/submissions/<SUBMISSION_ID>/resources/<RESOURCE_ID>" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN"

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Role } from "@/lib/rbac";

type AddResourceBody = {
  resource_type: "READINESS" | "LEARNER" | "ENROLMENT" | "DOCUMENT" | "INSTITUTION";
  resource_id_value: string;
  notes?: string;
  reason?: string; // For audit log
};

/**
 * POST /api/institutions/submissions/[submissionId]/resources
 * Adds a resource to a submission.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be INSTITUTION_ADMIN, INSTITUTION_STAFF, or PLATFORM_ADMIN
 * - NextAuth session:
 *   - INSTITUTION_ADMIN / INSTITUTION_STAFF: can add resources to submissions for their own institution
 *   - PLATFORM_ADMIN: can add resources to any submission (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Validations:
 * - Submission must exist and not be deleted
 * - Submission must belong to the institution (for INSTITUTION_* roles)
 * - Can only add resources to DRAFT or SUBMITTED submissions (institutions can't modify reviewed submissions)
 * - Resource type must be valid
 * - Resource ID value must be provided
 * - Resource must not already exist in submission (unique constraint)
 * 
 * Returns:
 * {
 *   ...submissionResource...
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);
    
    // Only INSTITUTION_* roles and PLATFORM_ADMIN can add resources
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot add resources to submissions`,
        403
      );
    }

    // Unwrap params (Next.js 16)
    const { submissionId } = await params;

    // Parse and validate request body
    const body: AddResourceBody = await request.json();
    
    if (!body.resource_type) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing required field: resource_type",
        400
      );
    }

    if (!body.resource_id_value || body.resource_id_value.trim().length === 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing required field: resource_id_value",
        400
      );
    }

    const validResourceTypes = ["READINESS", "LEARNER", "ENROLMENT", "DOCUMENT", "INSTITUTION"];
    if (!validResourceTypes.includes(body.resource_type)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid resource_type: ${body.resource_type} (must be one of: ${validResourceTypes.join(", ")})`,
        400
      );
    }

    // Fetch submission to validate it exists and check institution scoping
    const submission = await prisma.submission.findUnique({
      where: {
        submission_id: submissionId,
        deleted_at: null,
      },
      select: {
        submission_id: true,
        institution_id: true,
        status: true,
        title: true,
      },
    });

    if (!submission) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `Submission not found: ${submissionId}`,
        404
      );
    }

    // Check if submission can be modified (only DRAFT or SUBMITTED can be edited by institutions)
    const editableStatuses = ["DRAFT", "SUBMITTED"];
    if (!editableStatuses.includes(submission.status)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Cannot add resources: Submission is ${submission.status} (only DRAFT or SUBMITTED submissions can be modified by institutions)`,
        400
      );
    }

    // Enforce institution scoping
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Institution users must belong to an institution",
          403
        );
      }

      if (ctx.institutionId !== submission.institution_id) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Cannot add resources to submissions from other institutions",
          403
        );
      }
    }
    // PLATFORM_ADMIN can add resources to any submission (app owners see everything! 🦸)

    // Check if resource already exists in submission
    const existingResource = await prisma.submissionResource.findUnique({
      where: {
        submission_id_resource_type_resource_id_value: {
          submission_id: submissionId,
          resource_type: body.resource_type,
          resource_id_value: body.resource_id_value,
        },
      },
      select: {
        resource_id: true,
      },
    });

    if (existingResource) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Resource already exists in this submission: ${body.resource_type}:${body.resource_id_value}`,
        400
      );
    }

    // Execute mutation with full RBAC and audit enforcement
    const resource = await mutateWithAudit({
      entityType: "SUBMISSION_RESOURCE",
      changeType: "CREATE",
      fieldName: "resource_id",
      oldValue: null,
      institutionId: submission.institution_id,
      reason: body.reason ?? `Add resource to submission: ${submission.title || submissionId}`,
      
      // RBAC: Only INSTITUTION_* roles and PLATFORM_ADMIN can add resources
      assertCan: async (tx, ctx) => {
        const allowedRoles: Role[] = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
        if (!allowedRoles.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot add resources to submissions`,
            403
          );
        }
      },
      
      // Mutation: Add resource to submission
      mutation: async (tx, ctx) => {
        const created = await tx.submissionResource.create({
          data: {
            submission_id: submissionId,
            resource_type: body.resource_type,
            resource_id_value: body.resource_id_value,
            added_by: ctx.userId,
            notes: body.notes || null,
          },
          include: {
            addedByUser: {
              select: {
                user_id: true,
                email: true,
                name: true,
              },
            },
          },
        });
        
        return created;
      },
    });
    
    // Add debug header in development
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }
    
    return NextResponse.json(resource, { 
      status: 201,
      headers,
    });
  } catch (error) {
    return fail(error);
  }
}

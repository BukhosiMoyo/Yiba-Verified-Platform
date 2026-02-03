// DELETE /api/institutions/submissions/[submissionId]/resources/[resourceId] - Remove resource from submission
//
// DELETE Test commands:
//   # With dev token (development only):
//   export BASE_URL="https://yibaverified.co.za"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -X DELETE "$BASE_URL/api/institutions/submissions/<SUBMISSION_ID>/resources/<RESOURCE_ID>" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN"

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Role } from "@/lib/rbac";

/**
 * DELETE /api/institutions/submissions/[submissionId]/resources/[resourceId]
 * Removes a resource from a submission.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be INSTITUTION_ADMIN, INSTITUTION_STAFF, or PLATFORM_ADMIN
 * - NextAuth session:
 *   - INSTITUTION_ADMIN / INSTITUTION_STAFF: can remove resources from submissions for their own institution
 *   - PLATFORM_ADMIN: can remove resources from any submission (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Validations:
 * - Submission must exist and not be deleted
 * - Resource must exist and belong to the submission
 * - Submission must belong to the institution (for INSTITUTION_* roles)
 * - Can only remove resources from DRAFT or SUBMITTED submissions (institutions can't modify reviewed submissions)
 * 
 * Returns:
 * {
 *   "message": "Resource removed from submission"
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string; resourceId: string }> }
) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);

    // Only INSTITUTION_* roles and PLATFORM_ADMIN can remove resources
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot remove resources from submissions`,
        403
      );
    }

    // Unwrap params (Next.js 16)
    const { submissionId, resourceId } = await params;

    // Fetch resource and submission to validate they exist and check institution scoping
    const resource = await prisma.submissionResource.findUnique({
      where: {
        resource_id: resourceId,
      },
      select: {
        resource_id: true,
        submission_id: true,
        resource_type: true,
        resource_id_value: true,
        submission: {
          select: {
            submission_id: true,
            institution_id: true,
            status: true,
            title: true,
            deleted_at: true,
          },
        },
      },
    });

    if (!resource) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `Resource not found: ${resourceId}`,
        404
      );
    }

    // Check if submission exists and is not deleted
    if (!resource.submission || resource.submission.deleted_at !== null) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `Submission not found: ${submissionId}`,
        404
      );
    }

    // Verify resource belongs to the submission
    if (resource.submission_id !== submissionId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Resource ${resourceId} does not belong to submission ${submissionId}`,
        400
      );
    }

    // Check if submission can be modified (only DRAFT or SUBMITTED can be edited by institutions)
    const editableStatuses = ["DRAFT", "SUBMITTED"];
    if (!editableStatuses.includes(resource.submission.status)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Cannot remove resources: Submission is ${resource.submission.status} (only DRAFT or SUBMITTED submissions can be modified by institutions)`,
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

      if (ctx.institutionId !== resource.submission.institution_id) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Cannot remove resources from submissions from other institutions",
          403
        );
      }
    }
    // PLATFORM_ADMIN can remove resources from any submission (app owners see everything! 🦸)

    // Execute mutation with full RBAC and audit enforcement
    await mutateWithAudit({
      entityType: "SUBMISSION_RESOURCE",
      changeType: "DELETE",
      fieldName: "resource_id",
      oldValue: resourceId,
      newValue: null,
      institutionId: resource.submission.institution_id,
      reason: `Remove resource from submission: ${resource.submission.title || submissionId}`,

      // RBAC: Only INSTITUTION_* roles and PLATFORM_ADMIN can remove resources
      assertCan: async (tx, ctx) => {
        const allowedRoles: Role[] = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
        if (!allowedRoles.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot remove resources from submissions`,
            403
          );
        }
      },

      // Mutation: Delete resource from submission
      mutation: async (tx, ctx) => {
        await tx.submissionResource.delete({
          where: {
            resource_id: resourceId,
          },
        });

        return { resource_id: resourceId };
      },
    });

    // Add debug header in development
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }

    return NextResponse.json(
      { message: "Resource removed from submission" },
      { status: 200, headers }
    );
  } catch (error) {
    return fail(error);
  }
}

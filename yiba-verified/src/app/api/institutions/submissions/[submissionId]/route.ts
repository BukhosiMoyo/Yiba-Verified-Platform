// GET /api/institutions/submissions/[submissionId] - View a single submission
// PATCH /api/institutions/submissions/[submissionId] - Update or submit a submission
//
// GET Test commands:
//   # With dev token (development only):
//   export BASE_URL="http://localhost:3000"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -sS "$BASE_URL/api/institutions/submissions/<SUBMISSION_ID>" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
//
// PATCH Test commands:
//   # Submit a submission (change status from DRAFT to SUBMITTED):
//   curl -X PATCH "$BASE_URL/api/institutions/submissions/<SUBMISSION_ID>" \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
//     -d '{
//       "status": "SUBMITTED"
//     }'
//
//   # Update title:
//   curl -X PATCH "$BASE_URL/api/institutions/submissions/<SUBMISSION_ID>" \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
//     -d '{
//       "title": "Updated Compliance Pack 2024"
//     }'

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Role } from "@/lib/rbac";

type UpdateSubmissionBody = {
  title?: string;
  submission_type?: string;
  status?: "DRAFT" | "SUBMITTED"; // Institutions can only set DRAFT or SUBMITTED
  reason?: string; // For audit log
};

/**
 * GET /api/institutions/submissions/[submissionId]
 * Fetches a single submission for an institution.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be INSTITUTION_ADMIN, INSTITUTION_STAFF, or PLATFORM_ADMIN
 * - NextAuth session:
 *   - INSTITUTION_ADMIN / INSTITUTION_STAFF: can view submissions for their own institution
 *   - PLATFORM_ADMIN: can view any submission (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Returns:
 * {
 *   ...submission with relations...
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);
    
    // Only INSTITUTION_* roles and PLATFORM_ADMIN can view submissions
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot view submissions`,
        403
      );
    }

    // Unwrap params (Next.js 16)
    const { submissionId } = await params;

    // Build where clause with access control
    const where: any = {
      submission_id: submissionId,
      deleted_at: null, // Only non-deleted
    };

    // INSTITUTION_* roles: Only see submissions for their institution
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Institution users must belong to an institution",
          403
        );
      }
      where.institution_id = ctx.institutionId;
    }
    // PLATFORM_ADMIN: can view any submission (no filter - app owners see everything! 🦸)

    // Fetch submission from database
    const submission = await prisma.submission.findFirst({
      where,
      include: {
        institution: {
          select: {
            institution_id: true,
            name: true,
            code: true,
            type: true,
          },
        },
        submittedByUser: {
          select: {
            user_id: true,
            email: true,
            name: true,
          },
        },
        reviewedByUser: {
          select: {
            user_id: true,
            email: true,
            name: true,
          },
        },
        submissionResources: {
          select: {
            resource_id: true,
            resource_type: true,
            resource_id_value: true,
            added_at: true,
            notes: true,
            addedByUser: {
              select: {
                user_id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: {
            added_at: "desc",
          },
        },
      },
    });

    if (!submission) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `Submission not found: ${submissionId}`,
        404
      );
    }

    // Add debug header in development
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }

    return NextResponse.json(submission, { status: 200, headers });
  } catch (error) {
    return fail(error);
  }
}

/**
 * PATCH /api/institutions/submissions/[submissionId]
 * Updates a submission (e.g., submit it, update title, etc.).
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be INSTITUTION_ADMIN, INSTITUTION_STAFF, or PLATFORM_ADMIN
 * - NextAuth session:
 *   - INSTITUTION_ADMIN / INSTITUTION_STAFF: can update submissions for their own institution
 *   - PLATFORM_ADMIN: can update any submission (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Validations:
 * - Submission must exist and not be deleted
 * - Submission must belong to the institution (for INSTITUTION_* roles)
 * - Can only update DRAFT or SUBMITTED submissions (institutions can't change reviewed submissions)
 * - Status can only be set to DRAFT or SUBMITTED (institutions can't set other statuses)
 * 
 * Updates:
 * - title: optional title/description
 * - submission_type: optional type
 * - status: DRAFT or SUBMITTED (if SUBMITTED, sets submitted_at and submitted_by)
 * 
 * Returns:
 * {
 *   ...updated submission with relations...
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);
    
    // Only INSTITUTION_* roles and PLATFORM_ADMIN can update submissions
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot update submissions`,
        403
      );
    }

    // Unwrap params (Next.js 16)
    const { submissionId } = await params;

    // Parse and validate request body
    const body: UpdateSubmissionBody = await request.json();

    // Validate status if provided
    if (body.status && body.status !== "DRAFT" && body.status !== "SUBMITTED") {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid status: ${body.status} (institutions can only set DRAFT or SUBMITTED)`,
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

    // Check if submission can be updated (only DRAFT or SUBMITTED can be edited by institutions)
    const editableStatuses = ["DRAFT", "SUBMITTED"];
    if (!editableStatuses.includes(submission.status)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Cannot update submission: Submission is ${submission.status} (only DRAFT or SUBMITTED submissions can be updated by institutions)`,
        400
      );
    }

    // Enforce institution scoping (INSTITUTION_* roles can only update submissions for their institution)
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
          "Cannot update submissions from other institutions",
          403
        );
      }
    }
    // PLATFORM_ADMIN can update any submission (app owners see everything! 🦸)

    // Build update data
    const updateData: any = {};
    if (body.title !== undefined) {
      updateData.title = body.title || null;
    }
    if (body.submission_type !== undefined) {
      updateData.submission_type = body.submission_type || null;
    }
    if (body.status) {
      updateData.status = body.status;
      // If submitting (status = SUBMITTED), set submitted_at and submitted_by
      if (body.status === "SUBMITTED") {
        updateData.submitted_at = new Date();
        updateData.submitted_by = ctx.userId;
      }
      // If reverting to DRAFT, clear submitted_at and submitted_by
      if (body.status === "DRAFT") {
        updateData.submitted_at = null;
        updateData.submitted_by = null;
      }
    }

    // Determine which field changed for audit log
    let fieldName = "submission_id";
    let oldValue: string | null = null;
    let newValue: string | null = null;

    if (body.status) {
      fieldName = "status";
      oldValue = submission.status;
      newValue = body.status;
    } else if (body.title !== undefined) {
      fieldName = "title";
      oldValue = submission.title || null;
      newValue = body.title || null;
    }

    // Execute mutation with full RBAC and audit enforcement
    const updatedSubmission = await mutateWithAudit({
      entityType: "SUBMISSION",
      changeType: "UPDATE",
      fieldName,
      oldValue,
      newValue,
      institutionId: submission.institution_id,
      reason: body.reason ?? (body.status === "SUBMITTED" ? `Submit submission: ${submission.title || submissionId}` : `Update submission: ${submission.title || submissionId}`),
      
      // RBAC: Only INSTITUTION_* roles and PLATFORM_ADMIN can update submissions
      assertCan: async (tx, ctx) => {
        const allowedRoles: Role[] = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
        if (!allowedRoles.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot update submissions`,
            403
          );
        }

        // Double-check institution scoping
        if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
          if (!ctx.institutionId || ctx.institutionId !== submission.institution_id) {
            throw new AppError(
              ERROR_CODES.FORBIDDEN,
              "Cannot update submissions from other institutions",
              403
            );
          }
        }
      },
      
      // Mutation: Update submission
      mutation: async (tx, ctx) => {
        const updated = await tx.submission.update({
          where: {
            submission_id: submissionId,
          },
          data: updateData,
          include: {
            institution: {
              select: {
                institution_id: true,
                name: true,
                code: true,
              },
            },
            submittedByUser: {
              select: {
                user_id: true,
                email: true,
                name: true,
              },
            },
            reviewedByUser: {
              select: {
                user_id: true,
                email: true,
                name: true,
              },
            },
            submissionResources: {
              select: {
                resource_id: true,
                resource_type: true,
                resource_id_value: true,
                added_at: true,
                notes: true,
                addedByUser: {
                  select: {
                    user_id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
        
        return updated;
      },
    });
    
    // Add debug header in development
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }
    
    return NextResponse.json(updatedSubmission, { 
      status: 200,
      headers,
    });
  } catch (error) {
    return fail(error);
  }
}

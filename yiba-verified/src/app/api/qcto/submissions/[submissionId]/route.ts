// GET /api/qcto/submissions/[submissionId] - View a single submission
// PATCH /api/qcto/submissions/[submissionId] - Review a submission (QCTO)
//
// GET Test commands:
//   # With dev token (development only):
//   export BASE_URL="http://localhost:3000"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -sS "$BASE_URL/api/qcto/submissions/<SUBMISSION_ID>" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
//
// PATCH Test commands:
//   # Review and approve submission:
//   curl -X PATCH "$BASE_URL/api/qcto/submissions/<SUBMISSION_ID>" \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
//     -d '{
//       "status": "APPROVED",
//       "review_notes": "All resources verified. Submission approved."
//     }'
//
//   # Review and reject submission:
//   curl -X PATCH "$BASE_URL/api/qcto/submissions/<SUBMISSION_ID>" \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
//     -d '{
//       "status": "REJECTED",
//       "review_notes": "Missing required documentation. Submission rejected."
//     }'

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateRouteParamUUID } from "@/lib/security/validation";
import { applyRateLimit, RATE_LIMITS, enforceRequestSizeLimit } from "@/lib/api/routeHelpers";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData, QCTO_DATA_ACCESS_ROLES, type Role } from "@/lib/rbac";
import { Notifications } from "@/lib/notifications";
import { isReviewerAssignedToReview } from "@/lib/reviewAssignments";

type ReviewSubmissionBody = {
  status?: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RETURNED_FOR_CORRECTION";
  review_notes?: string;
  reason?: string; // For audit log
};

/**
 * GET /api/qcto/submissions/[submissionId]
 * Fetches a single submission by ID.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be QCTO_USER or PLATFORM_ADMIN
 * - NextAuth session:
 *   - QCTO_USER: can view any submission (they're reviewers!)
 *   - PLATFORM_ADMIN: can view any submission (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Note: Access to resources within the submission is controlled by canReadForQCTO()
 * at the resource level. This endpoint just returns the submission metadata.
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
    // Apply rate limiting (use user ID for authenticated users)
    let rateLimitHeaders: Record<string, string> = {};
    
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);
    
    // Apply rate limiting with user context
    rateLimitHeaders = applyRateLimit(request, RATE_LIMITS.STANDARD, ctx.userId);
    
    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot access QCTO endpoints`,
        403
      );
    }

    // Unwrap and validate params (Next.js 16)
    const { submissionId: rawSubmissionId } = await params;
    const submissionId = validateRouteParamUUID(rawSubmissionId, "submissionId");

    // Fetch submission with relations
    const submission = await prisma.submission.findUnique({
      where: {
        submission_id: submissionId,
        deleted_at: null, // Only non-deleted
      },
      include: {
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
            registration_number: true,
            institution_type: true,
          },
        },
        submittedByUser: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        reviewedByUser: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
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
                first_name: true,
                last_name: true,
              },
            },
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
    const headers: Record<string, string> = { ...rateLimitHeaders };
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }

    return NextResponse.json(submission, { status: 200, headers });
  } catch (error) {
    return fail(error);
  }
}

/**
 * PATCH /api/qcto/submissions/[submissionId]
 * Reviews a submission (QCTO review workflow).
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be QCTO_USER or PLATFORM_ADMIN
 * - NextAuth session:
 *   - QCTO_USER: can review any submission (they're reviewers!)
 *   - PLATFORM_ADMIN: can review any submission (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Validations:
 * - Submission must exist and not be deleted
 * - Can only review SUBMITTED or UNDER_REVIEW submissions
 * - Status must be UNDER_REVIEW, APPROVED, REJECTED, or RETURNED_FOR_CORRECTION
 * 
 * Updates:
 * - status: UNDER_REVIEW, APPROVED, REJECTED, or RETURNED_FOR_CORRECTION
 * - review_notes: optional notes from QCTO reviewer
 * - reviewed_at: current timestamp (set when status changes)
 * - reviewed_by: current QCTO user ID
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
    // Enforce request size limit
    await enforceRequestSizeLimit(request);
    
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);
    
    // Apply rate limiting with user context
    const rateLimitHeaders = applyRateLimit(request, RATE_LIMITS.STANDARD, ctx.userId);
    
    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot review submissions`,
        403
      );
    }

    // Unwrap and validate params (Next.js 16)
    const { submissionId: rawSubmissionId } = await params;
    const submissionId = validateRouteParamUUID(rawSubmissionId, "submissionId");

    // Parse and validate request body
    const body: ReviewSubmissionBody = await request.json();

    // Validate status if provided
    if (body.status) {
      const validStatuses = ["UNDER_REVIEW", "APPROVED", "REJECTED", "RETURNED_FOR_CORRECTION"];
      if (!validStatuses.includes(body.status)) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Invalid status: ${body.status} (QCTO can only set: ${validStatuses.join(", ")})`,
          400
        );
      }
    }

    // Fetch submission to validate it exists
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

    // Check if submission can be reviewed (only SUBMITTED or UNDER_REVIEW can be reviewed)
    const reviewableStatuses = ["SUBMITTED", "UNDER_REVIEW"];
    if (!reviewableStatuses.includes(submission.status)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Cannot review submission: Submission is ${submission.status} (only SUBMITTED or UNDER_REVIEW submissions can be reviewed by QCTO)`,
        400
      );
    }

    // Check if reviewer is assigned to this review (optional check - QCTO_SUPER_ADMIN and QCTO_ADMIN can review regardless)
    const canReviewWithoutAssignment = ["QCTO_SUPER_ADMIN", "QCTO_ADMIN"].includes(ctx.role);
    if (!canReviewWithoutAssignment) {
      const isAssigned = await isReviewerAssignedToReview(
        ctx.userId,
        "SUBMISSION",
        submissionId
      );
      if (!isAssigned) {
        // Log warning but allow review (assignment is tracked but not strictly enforced for backward compatibility)
        console.warn(
          `Reviewer ${ctx.userId} (${ctx.role}) is reviewing submission ${submissionId} without assignment`
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (body.status) {
      updateData.status = body.status;
      // Set reviewed_at and reviewed_by when status changes (any review action)
      updateData.reviewed_at = new Date();
      updateData.reviewed_by = ctx.userId;
    }
    if (body.review_notes !== undefined) {
      updateData.review_notes = body.review_notes || null;
    }

    // Determine which field changed for audit log
    let fieldName = "submission_id";
    let oldValue: string | null = null;
    let newValue: string | null = null;

    if (body.status) {
      fieldName = "status";
      oldValue = submission.status;
      newValue = body.status;
    }

    // Execute mutation with full RBAC and audit enforcement
    const updatedSubmission = await mutateWithAudit({
      entityType: "SUBMISSION",
      changeType: "UPDATE",
      fieldName,
      oldValue,
      newValue,
      institutionId: submission.institution_id,
      reason: body.reason ?? `Review submission: ${submission.title || submissionId} - Status: ${body.status || "Review notes updated"}`,
      
      assertCan: async (tx, ctx) => {
        if (!QCTO_DATA_ACCESS_ROLES.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot review submissions`,
            403
          );
        }
      },
      
      // Mutation: Update submission review fields
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
                legal_name: true,
                trading_name: true,
                registration_number: true,
              },
            },
            submittedByUser: {
              select: {
                user_id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
            reviewedByUser: {
              select: {
                user_id: true,
                email: true,
                first_name: true,
                last_name: true,
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
                    first_name: true,
                    last_name: true,
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
    
    // Create notification for submission owner if status changed
    if (body.status && submission.status !== body.status) {
      // Find the user who submitted this submission
      const submissionOwner = await prisma.submission.findUnique({
        where: { submission_id: submissionId },
        select: { submitted_by: true },
      });

      if (submissionOwner?.submitted_by) {
        // Create notification for submission owner
        if (body.status === "APPROVED") {
          await Notifications.submissionReviewed(submissionOwner.submitted_by, submissionId, "APPROVED");
        } else if (body.status === "REJECTED") {
          await Notifications.submissionReviewed(submissionOwner.submitted_by, submissionId, "REJECTED");
        } else if (body.status === "UNDER_REVIEW") {
          await Notifications.submissionReviewed(submissionOwner.submitted_by, submissionId, "UNDER_REVIEW");
        }
      }
    }

    return NextResponse.json(updatedSubmission, { 
      status: 200,
      headers,
    });
  } catch (error) {
    return fail(error);
  }
}

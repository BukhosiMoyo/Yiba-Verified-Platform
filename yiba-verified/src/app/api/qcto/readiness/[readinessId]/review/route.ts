import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/lib/api/mutateWithAudit";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { Notifications } from "@/lib/notifications";
import { canAccessQctoData } from "@/lib/rbac";
import { hasCap } from "@/lib/capabilities";
import { isReviewerAssignedToReview } from "@/lib/reviewAssignments";
import { assertAssignedOrAdmin } from "@/lib/qctoAssignments";

interface RouteParams {
  params: Promise<{
    readinessId: string;
  }>;
}

interface ReviewReadinessBody {
  status?: "UNDER_REVIEW" | "RETURNED_FOR_CORRECTION" | "RECOMMENDED" | "REJECTED";
  recommendation?: "RECOMMENDED" | "NOT_RECOMMENDED"; // Official Form 5 Section 10 values
  verifier_remarks?: string; // Mandatory per Form 5 Section 10
  sme_name?: string; // Required for final recommendation
  sme_signature?: string; // Base64 image or file reference - required for final recommendation
  review_notes?: string; // Internal review notes
  learning_material_verification?: {
    coverage_percentage?: number;
    nqf_aligned?: boolean;
    knowledge_components_complete?: boolean;
    practical_components_complete?: boolean;
    quality_verified?: boolean;
  };
  return_reasons?: string[]; // Structured reasons for return
  return_remarks?: string; // Detailed return remarks
  criterion_reviews?: Array<{
    section_name: string;
    criterion_key?: string;
    response: "YES" | "NO" | "PASS" | "NEEDS_WORK" | "FAIL";
    mandatory_remarks: string;
    notes?: string;
  }>;
  remarks?: string; // Legacy field for backward compatibility
}

/**
 * PATCH /api/qcto/readiness/[readinessId]/review
 * 
 * Review a readiness record (QCTO only).
 * Allows QCTO to approve/reject/recommend readiness records with optional remarks.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { readinessId } = await params;

    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can review readiness records", 403));
    }

    const body: ReviewReadinessBody = await request.json();

    // Enforce capabilities: Viewer is read-only; RECOMMENDED/REJECTED require QCTO_RECORD_RECOMMENDATION; other review actions require QCTO_REVIEW
    const isPlatformAdmin = ctx.role === "PLATFORM_ADMIN";
    const canRecordRecommendation = isPlatformAdmin || hasCap(ctx.role, "QCTO_RECORD_RECOMMENDATION");
    const canReview = isPlatformAdmin || hasCap(ctx.role, "QCTO_REVIEW");

    if ((body.status === "RECOMMENDED" || body.status === "REJECTED" || body.recommendation != null) && !canRecordRecommendation) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only reviewers and admins can submit final recommendation (RECOMMENDED/REJECTED)", 403));
    }
    if (
      (body.status && body.status !== "RECOMMENDED" && body.status !== "REJECTED") ||
      body.criterion_reviews?.length ||
      body.return_remarks !== undefined ||
      body.return_reasons?.length
    ) {
      if (!canReview) {
        return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only reviewers and admins can perform review actions (status, section reviews, return for correction)", 403));
      }
    }
    // If body has any review-related fields, require at least one capability (or platform admin)
    const hasReviewPayload = body.status != null || body.recommendation != null || (body.criterion_reviews?.length ?? 0) > 0 || body.return_remarks != null || body.return_reasons != null;
    if (hasReviewPayload && !canReview && !canRecordRecommendation) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "You do not have permission to perform review actions (read-only)", 403));
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ["UNDER_REVIEW", "RETURNED_FOR_CORRECTION", "RECOMMENDED", "REJECTED"];
      if (!validStatuses.includes(body.status)) {
        return fail(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            `Invalid status: ${body.status} (QCTO can only set: ${validStatuses.join(", ")})`,
            400
          )
        );
      }
    }

    // Validate recommendation if provided (Form 5 Section 10)
    if (body.recommendation) {
      const validRecommendations = ["RECOMMENDED", "NOT_RECOMMENDED"]; // Official Form 5 values
      if (!validRecommendations.includes(body.recommendation)) {
        return fail(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            `Invalid recommendation: ${body.recommendation} (Form 5 Section 10 requires: ${validRecommendations.join(" or ")})`,
            400
          )
        );
      }
    }

    // Validate final recommendation requirements (Form 5 Section 10)
    if (body.status === "RECOMMENDED" || body.status === "REJECTED") {
      if (!body.recommendation) {
        return fail(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            "Final recommendation (RECOMMENDED or NOT_RECOMMENDED) is required for RECOMMENDED or REJECTED status",
            400
          )
        );
      }
      if (!body.verifier_remarks || !body.verifier_remarks.trim()) {
        return fail(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            "Verifier remarks are mandatory per Form 5 Section 10",
            400
          )
        );
      }
      if (!body.sme_name || !body.sme_name.trim()) {
        return fail(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            "SME name is required per Form 5 Section 10",
            400
          )
        );
      }
      if (!body.sme_signature) {
        return fail(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            "SME signature is required per Form 5 Section 10",
            400
          )
        );
      }
    }

    // Validate return for correction
    if (body.status === "RETURNED_FOR_CORRECTION") {
      if (!body.return_remarks || !body.return_remarks.trim()) {
        if (!body.return_reasons || body.return_reasons.length === 0) {
          return fail(
            new AppError(
              ERROR_CODES.VALIDATION_ERROR,
              "Return remarks or return reasons are required when returning for correction",
              400
            )
          );
        }
      }
    }

    // Fetch readiness record to validate it exists
    const readiness = await prisma.readiness.findFirst({
      where: {
        readiness_id: readinessId,
        deleted_at: null,
      },
      select: {
        readiness_id: true,
        institution_id: true,
        readiness_status: true,
        qualification_title: true,
      },
    });

    if (!readiness) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Readiness record not found", 404));
    }

    await assertAssignedOrAdmin("READINESS", readinessId, ctx.userId, ctx.role);

    // Check if readiness can be reviewed (SUBMITTED, UNDER_REVIEW, or RETURNED_FOR_CORRECTION can be reviewed)
    const reviewableStatuses = ["SUBMITTED", "UNDER_REVIEW", "RETURNED_FOR_CORRECTION"];
    if (body.status && !reviewableStatuses.includes(readiness.readiness_status)) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Cannot review readiness record: Status is ${readiness.readiness_status} (only SUBMITTED, UNDER_REVIEW, or RETURNED_FOR_CORRECTION records can be reviewed by QCTO)`,
          400
        )
      );
    }

    // For final recommendation (RECOMMENDED/REJECTED), only assigned reviewer or Admin/Super Admin can submit
    const canReviewWithoutAssignment = ["QCTO_SUPER_ADMIN", "QCTO_ADMIN", "PLATFORM_ADMIN"].includes(ctx.role);
    if ((body.status === "RECOMMENDED" || body.status === "REJECTED") && !canReviewWithoutAssignment) {
      const isAssigned = await isReviewerAssignedToReview(
        ctx.userId,
        "READINESS",
        readinessId
      );
      if (!isAssigned) {
        return fail(
          new AppError(
            ERROR_CODES.FORBIDDEN,
            "Only the assigned reviewer or an Admin/Super Admin can submit the final recommendation (RECOMMENDED/REJECTED)",
            403
          )
        );
      }
    }
    if (!canReviewWithoutAssignment) {
      const isAssigned = await isReviewerAssignedToReview(
        ctx.userId,
        "READINESS",
        readinessId
      );
      if (!isAssigned) {
        console.warn(
          `Reviewer ${ctx.userId} (${ctx.role}) is performing review actions on readiness ${readinessId} without assignment`
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (body.status) {
      updateData.readiness_status = body.status;
    }

    // Execute mutation with audit logging
    const updatedReadiness = await mutateWithAudit(ctx, {
      action: "READINESS_REVIEW",
      entityType: "READINESS",
      entityId: readinessId,
      fn: async (tx) => {
        // Update readiness status if provided
        const updated = await tx.readiness.update({
          where: { readiness_id: readinessId },
          data: updateData,
        });

        // Create or update recommendation (Form 5 Section 10)
        if (body.recommendation || body.verifier_remarks || body.remarks) {
          const recommendationData: any = {
            recommended_by: ctx.userId,
            recommendation: body.recommendation || null,
            remarks: body.remarks || null, // Legacy field
            verifier_remarks: body.verifier_remarks || null,
            sme_name: body.sme_name || null,
            sme_signature: body.sme_signature || null,
            verification_date: body.recommendation ? new Date() : null,
            review_notes: body.review_notes || null,
          };

          // Add learning material verification to section_scores if provided
          if (body.learning_material_verification) {
            recommendationData.section_scores = {
              section_9_learning_material: body.learning_material_verification,
            };
          }

          // Upsert recommendation (update if exists, create if not)
          await tx.readinessRecommendation.upsert({
            where: { readiness_id: readinessId },
            update: recommendationData,
            create: {
              readiness_id: readinessId,
              ...recommendationData,
            },
          });
        }

        // Create section reviews (per-criterion reviews)
        if (body.criterion_reviews && body.criterion_reviews.length > 0) {
          for (const criterionReview of body.criterion_reviews) {
            // Check if review already exists
            const existing = await tx.readinessSectionReview.findFirst({
              where: {
                readiness_id: readinessId,
                section_name: criterionReview.section_name,
                criterion_key: criterionReview.criterion_key || null,
                reviewer_id: ctx.userId,
              },
            });

            if (existing) {
              await tx.readinessSectionReview.update({
                where: { review_id: existing.review_id },
                data: {
                  response: criterionReview.response,
                  mandatory_remarks: criterionReview.mandatory_remarks,
                  notes: criterionReview.notes || null,
                },
              });
            } else {
              await tx.readinessSectionReview.create({
                data: {
                  readiness_id: readinessId,
                  section_name: criterionReview.section_name,
                  criterion_key: criterionReview.criterion_key || null,
                  reviewer_id: ctx.userId,
                  response: criterionReview.response,
                  mandatory_remarks: criterionReview.mandatory_remarks,
                  notes: criterionReview.notes || null,
                },
              });
            }
          }
        }

        // Update learning material verification fields if provided
        if (body.learning_material_verification) {
          await tx.readiness.update({
            where: { readiness_id: readinessId },
            data: {
              learning_material_nqf_aligned: body.learning_material_verification.nqf_aligned,
              knowledge_components_complete: body.learning_material_verification.knowledge_components_complete,
              practical_components_complete: body.learning_material_verification.practical_components_complete,
              learning_material_quality_verified: body.learning_material_verification.quality_verified,
            },
          });
        }

        return updated;
      },
    });

    // Create notification for readiness owner if status changed
    if (body.status && readiness.readiness_status !== body.status) {
      // Get institution admin users for this readiness record
      const institutionAdmins = await prisma.user.findMany({
        where: {
          institution_id: readiness.institution_id,
          role: { in: ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"] },
          deleted_at: null,
        },
        select: { user_id: true },
      });

      // Notify all institution admins
      for (const admin of institutionAdmins) {
        if (body.status === "RECOMMENDED") {
          await Notifications.readinessReviewed(admin.user_id, readinessId, "RECOMMENDED");
        } else if (body.status === "REJECTED") {
          await Notifications.readinessReviewed(admin.user_id, readinessId, "REJECTED");
        } else if (body.status === "UNDER_REVIEW") {
          await Notifications.readinessReviewed(admin.user_id, readinessId, "UNDER_REVIEW");
        } else if (body.status === "RETURNED_FOR_CORRECTION") {
          await Notifications.readinessReviewed(admin.user_id, readinessId, "RETURNED_FOR_CORRECTION");
        }
      }
    }

    return NextResponse.json({
      readiness_id: updatedReadiness.readiness_id,
      readiness_status: updatedReadiness.readiness_status,
      message: "Readiness record reviewed successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("PATCH /api/qcto/readiness/[readinessId]/review error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to review readiness record", 500));
  }
}

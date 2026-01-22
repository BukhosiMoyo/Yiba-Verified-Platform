import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/lib/api/mutateWithAudit";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { Notifications } from "@/lib/notifications";
import { canAccessQctoData } from "@/lib/rbac";
import { isReviewerAssignedToReview } from "@/lib/reviewAssignments";

interface RouteParams {
  params: Promise<{
    readinessId: string;
  }>;
}

interface ReviewReadinessBody {
  status?: "UNDER_REVIEW" | "RECOMMENDED" | "REJECTED";
  recommendation?: "APPROVE" | "CONDITIONAL_APPROVAL" | "REJECT";
  remarks?: string;
  reason?: string;
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

    // Validate status if provided
    if (body.status) {
      const validStatuses = ["UNDER_REVIEW", "RECOMMENDED", "REJECTED"];
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

    // Validate recommendation if provided
    if (body.recommendation) {
      const validRecommendations = ["APPROVE", "CONDITIONAL_APPROVAL", "REJECT"];
      if (!validRecommendations.includes(body.recommendation)) {
        return fail(
          new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            `Invalid recommendation: ${body.recommendation} (valid: ${validRecommendations.join(", ")})`,
            400
          )
        );
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

    // Check if readiness can be reviewed (only SUBMITTED or UNDER_REVIEW can be reviewed)
    const reviewableStatuses = ["SUBMITTED", "UNDER_REVIEW"];
    if (body.status && !reviewableStatuses.includes(readiness.readiness_status)) {
      return fail(
        new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Cannot review readiness record: Status is ${readiness.readiness_status} (only SUBMITTED or UNDER_REVIEW records can be reviewed by QCTO)`,
          400
        )
      );
    }

    // Check if reviewer is assigned to this review (optional check - QCTO_SUPER_ADMIN and QCTO_ADMIN can review regardless)
    const canReviewWithoutAssignment = ["QCTO_SUPER_ADMIN", "QCTO_ADMIN"].includes(ctx.role);
    if (!canReviewWithoutAssignment) {
      const isAssigned = await isReviewerAssignedToReview(
        ctx.userId,
        "READINESS",
        readinessId
      );
      if (!isAssigned) {
        // Log warning but allow review (assignment is tracked but not strictly enforced for backward compatibility)
        console.warn(
          `Reviewer ${ctx.userId} (${ctx.role}) is reviewing readiness ${readinessId} without assignment`
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

        // Create or update recommendation if provided
        if (body.recommendation || body.remarks) {
          const recommendationData = {
            recommended_by: ctx.userId,
            recommendation: body.recommendation || "APPROVE", // Default if not provided but remarks exist
            remarks: body.remarks || null,
          };

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

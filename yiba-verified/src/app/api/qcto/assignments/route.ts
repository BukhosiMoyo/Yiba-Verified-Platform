/**
 * GET /api/qcto/assignments
 *   ?userId=me|uuid - assignments for user (default: me)
 *   ?resourceType=READINESS|SUBMISSION|QCTO_REQUEST
 *   ?resourceId=uuid - filter by resource (optional)
 *   ?status=ACTIVE|REMOVED|COMPLETED
 *
 * POST /api/qcto/assignments
 *   Body: { resourceType, resourceId, assignedToUserId, assignmentRole? }
 *   Creates QctoAssignment; for READINESS also creates ReviewAssignment (sync).
 *
 * DELETE /api/qcto/assignments
 *   Body: { resourceType, resourceId, assignedToUserId, assignmentRole? }
 *   Sets QctoAssignment status to REMOVED; for READINESS also cancels ReviewAssignment.
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";
import { hasCap } from "@/lib/capabilities";
import {
  assignResourceToReviewer,
  removeAssignment,
  getAssignmentsForUser,
  type QctoResourceType,
} from "@/lib/qctoAssignments";
import { assignReviewToReviewer, unassignReviewFromReviewer, type ReviewType } from "@/lib/reviewAssignments";

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only QCTO and platform administrators can view assignments",
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId")?.trim() || "me";
    const resourceType = searchParams.get("resourceType")?.trim() as QctoResourceType | "";
    const statusParam = searchParams.get("status")?.trim() || "ACTIVE";

    const userId = userIdParam === "me" ? ctx.userId : userIdParam;
    if (userIdParam !== "me" && ctx.role !== "PLATFORM_ADMIN" && !hasCap(ctx.role, "QCTO_ASSIGN")) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only admins can view another user's assignments", 403);
    }

    const options: Parameters<typeof getAssignmentsForUser>[1] = {
      status: statusParam === "ACTIVE" || statusParam === "REMOVED" || statusParam === "COMPLETED" ? statusParam : "ACTIVE",
    };
    if (resourceType && ["READINESS", "SUBMISSION", "QCTO_REQUEST"].includes(resourceType)) {
      options.resource_type = resourceType as QctoResourceType;
    }

    const assignments = await getAssignmentsForUser(userId, options);
    return Response.json({ assignments, count: assignments.length });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("GET /api/qcto/assignments error:", error);
    return fail(error as Error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only QCTO and platform administrators can create assignments",
        403
      );
    }
    if (ctx.role !== "PLATFORM_ADMIN" && !hasCap(ctx.role, "QCTO_ASSIGN")) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO Admin and Super Admin can assign", 403);
    }

    const body = await request.json();
    const resourceType = body?.resourceType as string;
    const resourceId = body?.resourceId as string;
    const assignedToUserId = body?.assignedToUserId as string;
    const assignmentRole = (body?.assignmentRole as "REVIEWER" | "AUDITOR") || "REVIEWER";

    if (!resourceType || !resourceId || !assignedToUserId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "resourceType, resourceId, and assignedToUserId are required",
        400
      );
    }
    const validTypes: QctoResourceType[] = ["READINESS", "SUBMISSION", "QCTO_REQUEST"];
    if (!validTypes.includes(resourceType as QctoResourceType)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `resourceType must be one of: ${validTypes.join(", ")}`,
        400
      );
    }

    if (resourceType === "READINESS") {
      // Creates ReviewAssignment and syncs QctoAssignment
      await assignReviewToReviewer(ctx, {
        reviewType: "READINESS" as ReviewType,
        reviewId: resourceId,
        assignedToUserId,
        assignmentRole,
      });
    } else {
      await assignResourceToReviewer(ctx, {
        resource_type: resourceType as QctoResourceType,
        resource_id: resourceId,
        assigned_to_user_id: assignedToUserId,
        assignment_role: assignmentRole,
      });
    }

    return Response.json({
      success: true,
      message: "Assignment created",
      assignments: await getAssignmentsForUser(assignedToUserId, {
        resource_type: resourceType as QctoResourceType,
        status: "ACTIVE",
      }),
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("POST /api/qcto/assignments error:", error);
    return fail(error as Error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only QCTO and platform administrators can remove assignments",
        403
      );
    }
    if (ctx.role !== "PLATFORM_ADMIN" && !hasCap(ctx.role, "QCTO_ASSIGN")) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO Admin and Super Admin can unassign", 403);
    }

    const body = await request.json();
    const resourceType = body?.resourceType as string;
    const resourceId = body?.resourceId as string;
    const assignedToUserId = body?.assignedToUserId as string;
    const assignmentRole = body?.assignmentRole as "REVIEWER" | "AUDITOR" | undefined;

    if (!resourceType || !resourceId || !assignedToUserId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "resourceType, resourceId, and assignedToUserId are required",
        400
      );
    }
    const validTypes: QctoResourceType[] = ["READINESS", "SUBMISSION", "QCTO_REQUEST"];
    if (!validTypes.includes(resourceType as QctoResourceType)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `resourceType must be one of: ${validTypes.join(", ")}`,
        400
      );
    }

    if (resourceType === "READINESS") {
      await unassignReviewFromReviewer(ctx, "READINESS" as ReviewType, resourceId, assignedToUserId);
    } else {
      await removeAssignment(ctx, {
        resource_type: resourceType as QctoResourceType,
        resource_id: resourceId,
        assigned_to_user_id: assignedToUserId,
        assignment_role: assignmentRole,
      });
    }

    return Response.json({ success: true, message: "Assignment removed" });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("DELETE /api/qcto/assignments error:", error);
    return fail(error as Error);
  }
}

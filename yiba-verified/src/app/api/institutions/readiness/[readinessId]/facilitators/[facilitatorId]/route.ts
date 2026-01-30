/**
 * PATCH /api/institutions/readiness/[readinessId]/facilitators/[facilitatorId] - Update facilitator
 * DELETE /api/institutions/readiness/[readinessId]/facilitators/[facilitatorId] - Remove facilitator
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { mutateWithAudit } from "@/server/mutations/mutate";

async function getReadinessAndFacilitator(
  readinessId: string,
  facilitatorId: string,
  institutionId: string | null,
  role: string
) {
  const readiness = await prisma.readiness.findFirst({
    where: { readiness_id: readinessId, deleted_at: null },
    select: { institution_id: true },
  });
  if (!readiness) return { error: "Readiness not found" as const };
  if (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") {
    if (institutionId !== readiness.institution_id) return { error: "Forbidden" as const };
  }

  const facilitator = await prisma.facilitator.findFirst({
    where: { facilitator_id: facilitatorId, readiness_id: readinessId },
  });
  if (!facilitator) return { error: "Facilitator not found" as const };

  return { readiness, facilitator };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ readinessId: string; facilitatorId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { readinessId, facilitatorId } = await params;

    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions", 403);
    }
    if (!ctx.institutionId) {
      throw new AppError(ERROR_CODES.UNAUTHENTICATED, "Institution context required", 401);
    }

    const result = await getReadinessAndFacilitator(readinessId, facilitatorId, ctx.institutionId, ctx.role);
    if ("error" in result) {
      throw new AppError(
        result.error === "Facilitator not found" ? ERROR_CODES.NOT_FOUND : result.error === "Forbidden" ? ERROR_CODES.FORBIDDEN : ERROR_CODES.NOT_FOUND,
        result.error,
        result.error === "Forbidden" ? 403 : 404
      );
    }
    const { readiness, facilitator } = result;

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.first_name !== undefined) updateData.first_name = (body.first_name as string)?.trim() || facilitator.first_name;
    if (body.last_name !== undefined) updateData.last_name = (body.last_name as string)?.trim() || facilitator.last_name;

    if (Object.keys(updateData).length === 0) {
      return ok({ facilitator });
    }

    const updated = await mutateWithAudit({
      entityType: "FACILITATOR",
      entityId: facilitatorId,
      changeType: "UPDATE",
      fieldName: Object.keys(updateData).join(","),
      oldValue: facilitator,
      newValue: { ...facilitator, ...updateData },
      institutionId: readiness.institution_id,
      reason: "Update facilitator",
      assertCan: async () => {},
      mutation: async (tx) => {
        return await tx.facilitator.update({
          where: { facilitator_id: facilitatorId },
          data: updateData,
        });
      },
    });

    return ok({ facilitator: updated });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("PATCH /api/institutions/readiness/.../facilitators/[facilitatorId] error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to update facilitator", 500));
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ readinessId: string; facilitatorId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { readinessId, facilitatorId } = await params;

    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions", 403);
    }
    if (!ctx.institutionId) {
      throw new AppError(ERROR_CODES.UNAUTHENTICATED, "Institution context required", 401);
    }

    const result = await getReadinessAndFacilitator(readinessId, facilitatorId, ctx.institutionId, ctx.role);
    if ("error" in result) {
      throw new AppError(
        result.error === "Facilitator not found" ? ERROR_CODES.NOT_FOUND : result.error === "Forbidden" ? ERROR_CODES.FORBIDDEN : ERROR_CODES.NOT_FOUND,
        result.error,
        result.error === "Forbidden" ? 403 : 404
      );
    }
    const { readiness, facilitator } = result;

    await mutateWithAudit({
      entityType: "FACILITATOR",
      entityId: facilitatorId,
      changeType: "DELETE",
      fieldName: "facilitator_id",
      oldValue: facilitator,
      newValue: null,
      institutionId: readiness.institution_id,
      reason: "Remove facilitator from readiness",
      assertCan: async () => {},
      mutation: async (tx) => {
        await tx.facilitator.delete({
          where: { facilitator_id: facilitatorId },
        });
        return null;
      },
    });

    return ok({ deleted: true });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("DELETE /api/institutions/readiness/.../facilitators/[facilitatorId] error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to remove facilitator", 500));
  }
}

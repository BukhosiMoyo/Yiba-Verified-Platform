/**
 * GET /api/institutions/readiness/[readinessId]/facilitators - List facilitators for this readiness
 * POST /api/institutions/readiness/[readinessId]/facilitators - Add facilitator (from profile user_id or manual)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { mutateWithAudit } from "@/server/mutations/mutate";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ readinessId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { readinessId } = await params;

    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions", 403);
    }

    const readiness = await prisma.readiness.findFirst({
      where: { readiness_id: readinessId, deleted_at: null },
      select: { institution_id: true },
    });
    if (!readiness) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Readiness not found", 404);
    }

    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (ctx.institutionId !== readiness.institution_id) {
        throw new AppError(ERROR_CODES.FORBIDDEN, "Readiness belongs to another institution", 403);
      }
    }

    const facilitators = await prisma.facilitator.findMany({
      where: { readiness_id: readinessId },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
            facilitator_profile_complete: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    return ok({ facilitators });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/institutions/readiness/[readinessId]/facilitators error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to list facilitators", 500));
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ readinessId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { readinessId } = await params;

    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions", 403);
    }
    if (!ctx.institutionId) {
      throw new AppError(ERROR_CODES.UNAUTHENTICATED, "Institution context required", 401);
    }

    const readiness = await prisma.readiness.findFirst({
      where: { readiness_id: readinessId, deleted_at: null },
      select: { institution_id: true },
    });
    if (!readiness || readiness.institution_id !== ctx.institutionId) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Readiness not found or access denied", 404);
    }

    const body = await request.json();

    if (body.user_id) {
      // Add from institution facilitator profile: user must have can_facilitate and complete profile
      const ui = await prisma.userInstitution.findUnique({
        where: {
          user_id_institution_id: { user_id: body.user_id, institution_id: readiness.institution_id },
        },
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              facilitator_profile_complete: true,
            },
          },
        },
      });
      if (!ui?.can_facilitate || !ui.user?.facilitator_profile_complete) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "User is not an eligible facilitator for this institution or profile is incomplete",
          400
        );
      }

      const created = await mutateWithAudit({
        entityType: "FACILITATOR",
        changeType: "CREATE",
        fieldName: "facilitator",
        oldValue: null,
        newValue: { readiness_id: readinessId, user_id: body.user_id, first_name: ui.user.first_name, last_name: ui.user.last_name },
        institutionId: readiness.institution_id,
        reason: `Add facilitator from profile: ${ui.user.first_name} ${ui.user.last_name}`,
        assertCan: async () => { },
        mutation: async (tx) => {
          return await tx.facilitator.create({
            data: {
              readiness_id: readinessId,
              user_id: body.user_id,
              first_name: ui.user!.first_name,
              last_name: ui.user!.last_name,
            },
          });
        },
      });

      const facilitator = await prisma.facilitator.findUnique({
        where: { facilitator_id: created.facilitator_id },
        include: { user: { select: { email: true } } },
      });
      return ok({ facilitator: facilitator ?? created });
    }

    // Manual add: require first_name, last_name
    const first_name = (body.first_name as string)?.trim();
    const last_name = (body.last_name as string)?.trim();
    if (!first_name || !last_name) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "first_name and last_name are required for manual add", 400);
    }

    const facilitator = await mutateWithAudit({
      entityType: "FACILITATOR",
      changeType: "CREATE",
      fieldName: "facilitator",
      oldValue: null,
      newValue: { readiness_id: readinessId, first_name, last_name },
      institutionId: readiness.institution_id,
      reason: `Add facilitator (manual): ${first_name} ${last_name}`,
      assertCan: async () => { },
      mutation: async (tx) => {
        return await tx.facilitator.create({
          data: {
            readiness_id: readinessId,
            first_name,
            last_name,
          },
        });
      },
    });

    const withUser = await prisma.facilitator.findUnique({
      where: { facilitator_id: facilitator.facilitator_id },
      include: { user: { select: { email: true } } },
    });
    return ok({ facilitator: withUser ?? facilitator });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("POST /api/institutions/readiness/[readinessId]/facilitators error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to add facilitator", 500));
  }
}

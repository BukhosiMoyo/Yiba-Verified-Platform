/**
 * GET /api/institutions/readiness/[readinessId]/facilitators/eligible
 * List users who can be selected as facilitators for this readiness:
 * - UserInstitution for this readiness's institution with can_facilitate = true
 * - facilitator_profile_complete = true
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

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

    const userInstitutions = await prisma.userInstitution.findMany({
      where: {
        institution_id: readiness.institution_id,
        can_facilitate: true,
        user: {
          deleted_at: null,
          facilitator_profile_complete: true,
        },
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    const eligible = userInstitutions.map((ui) => ({
      user_id: ui.user.user_id,
      first_name: ui.user.first_name,
      last_name: ui.user.last_name,
      full_name: `${ui.user.first_name} ${ui.user.last_name}`.trim(),
      email: ui.user.email,
    }));

    return ok({ eligible });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/institutions/readiness/[readinessId]/facilitators/eligible error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to list eligible facilitators", 500));
  }
}

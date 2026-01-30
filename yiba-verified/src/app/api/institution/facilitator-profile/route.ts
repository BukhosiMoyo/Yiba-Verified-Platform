/**
 * GET /api/institution/facilitator-profile - Get current user's facilitator profile (must have can_facilitate at institution)
 * PATCH /api/institution/facilitator-profile - Update facilitator fields and recompute completeness
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { computeFacilitatorProfileCompleteness } from "@/lib/facilitatorProfileCompleteness";

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Institution role required", 403);
    }
    if (!ctx.institutionId) {
      throw new AppError(ERROR_CODES.UNAUTHENTICATED, "Institution context required", 401);
    }

    const ui = await prisma.userInstitution.findUnique({
      where: {
        user_id_institution_id: { user_id: ctx.userId, institution_id: ctx.institutionId },
      },
    });
    if (!ui?.can_facilitate) {
      return ok({
        can_facilitate: false,
        profile: null,
        message: "You are not marked as a facilitator for this institution.",
      });
    }

    const [user, profileDocs] = await Promise.all([
      prisma.user.findUnique({
        where: { user_id: ctx.userId, deleted_at: null },
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          facilitator_id_number: true,
          facilitator_qualifications: true,
          facilitator_industry_experience: true,
          facilitator_profile_complete: true,
        },
      }),
      prisma.document.findMany({
        where: {
          related_entity: "USER_FACILITATOR_PROFILE",
          related_entity_id: ctx.userId,
        },
        select: {
          document_id: true,
          document_type: true,
          file_name: true,
          uploaded_at: true,
        },
      }),
    ]);
    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    const { complete, percentage } = await computeFacilitatorProfileCompleteness(ctx.userId);

    return ok({
      can_facilitate: true,
      profile: {
        ...user,
        facilitatorProfileDocuments: profileDocs,
        completeness_percentage: percentage,
        completeness_complete: complete,
      },
    });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/institution/facilitator-profile error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to get facilitator profile", 500));
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Institution role required", 403);
    }
    if (!ctx.institutionId) {
      throw new AppError(ERROR_CODES.UNAUTHENTICATED, "Institution context required", 401);
    }

    const ui = await prisma.userInstitution.findUnique({
      where: {
        user_id_institution_id: { user_id: ctx.userId, institution_id: ctx.institutionId },
      },
    });
    if (!ui?.can_facilitate) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "You are not a facilitator for this institution", 403);
    }

    const body = await request.json();
    const updateData: {
      facilitator_id_number?: string | null;
      facilitator_qualifications?: string | null;
      facilitator_industry_experience?: string | null;
    } = {};
    if (body.facilitator_id_number !== undefined) updateData.facilitator_id_number = body.facilitator_id_number ?? null;
    if (body.facilitator_qualifications !== undefined) updateData.facilitator_qualifications = body.facilitator_qualifications ?? null;
    if (body.facilitator_industry_experience !== undefined) updateData.facilitator_industry_experience = body.facilitator_industry_experience ?? null;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { user_id: ctx.userId },
        data: updateData,
      });
    }
    const { complete } = await computeFacilitatorProfileCompleteness(ctx.userId);
    await prisma.user.update({
      where: { user_id: ctx.userId },
      data: { facilitator_profile_complete: complete },
    });

    const user = await prisma.user.findUnique({
      where: { user_id: ctx.userId },
      select: {
        facilitator_id_number: true,
        facilitator_qualifications: true,
        facilitator_industry_experience: true,
        facilitator_profile_complete: true,
      },
    });
    const { percentage } = await computeFacilitatorProfileCompleteness(ctx.userId);

    return ok({
      profile: user,
      completeness_percentage: percentage,
      completeness_complete: complete,
    });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("PATCH /api/institution/facilitator-profile error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to update facilitator profile", 500));
  }
}

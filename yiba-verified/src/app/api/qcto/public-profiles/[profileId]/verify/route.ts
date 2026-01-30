/**
 * PATCH /api/qcto/public-profiles/[profileId]/verify - Set verification status (PENDING | VERIFIED).
 * QCTO and PLATFORM_ADMIN only. Updates verified_at and verified_by_user_id when VERIFIED.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";

type Params = { params: Promise<{ profileId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { ctx } = await requireAuth(request);
    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO or Platform Admin can verify public profiles", 403));
    }

    const { profileId } = await params;
    const profile = await prisma.institutionPublicProfile.findUnique({
      where: { id: profileId },
      select: { id: true, institution_id: true, verification_status: true },
    });
    if (!profile) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Public profile not found", 404));
    }

    // Province scope: if QCTO (non-super), ensure institution is in assigned provinces
    if (ctx.role !== "QCTO_SUPER_ADMIN" && ctx.role !== "PLATFORM_ADMIN") {
      const user = await prisma.user.findUnique({
        where: { user_id: ctx.userId },
        select: { assigned_provinces: true, default_province: true },
      });
      const provinces: string[] = user?.assigned_provinces ?? (user?.default_province ? [user.default_province] : []);
      if (provinces.length > 0) {
        const inst = await prisma.institution.findUnique({
          where: { institution_id: profile.institution_id },
          select: { province: true },
        });
        if (!inst || !provinces.includes(inst.province)) {
          return fail(new AppError(ERROR_CODES.FORBIDDEN, "You do not have access to this institution's province", 403));
        }
      }
    }

    const body = await request.json();
    const verification_status = body?.verification_status;
    if (!verification_status || !["PENDING", "VERIFIED"].includes(verification_status)) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "verification_status must be PENDING or VERIFIED", 400));
    }

    const updated = await prisma.institutionPublicProfile.update({
      where: { id: profileId },
      data: {
        verification_status: verification_status as "PENDING" | "VERIFIED",
        verified_at: verification_status === "VERIFIED" ? new Date() : null,
        verified_by_user_id: verification_status === "VERIFIED" ? ctx.userId : null,
      },
    });

    return Response.json(updated);
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("PATCH /api/qcto/public-profiles/[profileId]/verify error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to update verification status", 500));
  }
}

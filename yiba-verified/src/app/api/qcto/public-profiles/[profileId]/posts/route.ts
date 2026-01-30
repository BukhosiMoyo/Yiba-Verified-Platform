/**
 * GET /api/qcto/public-profiles/[profileId]/posts - List posts for a public profile's institution.
 * QCTO and PLATFORM_ADMIN only. Used for post verification from QCTO public profiles page.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";

type Params = { params: Promise<{ profileId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { ctx } = await requireAuth(request);
    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO or Platform Admin can list posts", 403));
    }

    const { profileId } = await params;
    const profile = await prisma.institutionPublicProfile.findUnique({
      where: { id: profileId },
      select: { institution_id: true, institution: { select: { province: true } } },
    });
    if (!profile) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Public profile not found", 404));
    }

    if (ctx.role !== "QCTO_SUPER_ADMIN" && ctx.role !== "PLATFORM_ADMIN") {
      const user = await prisma.user.findUnique({
        where: { user_id: ctx.userId },
        select: { assigned_provinces: true, default_province: true },
      });
      const provinces: string[] = user?.assigned_provinces ?? (user?.default_province ? [user.default_province] : []);
      if (provinces.length > 0 && !provinces.includes(profile.institution.province)) {
        return fail(new AppError(ERROR_CODES.FORBIDDEN, "You do not have access to this institution's province", 403));
      }
    }

    const posts = await prisma.institutionPost.findMany({
      where: { institution_id: profile.institution_id },
      orderBy: { created_at: "desc" },
    });

    return Response.json({ items: posts });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/qcto/public-profiles/[profileId]/posts error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to list posts", 500));
  }
}

/**
 * PATCH /api/qcto/posts/[postId]/verify - Set post is_verified.
 * QCTO and PLATFORM_ADMIN only. Province scope: post's institution must be in user's assigned provinces (unless super/admin).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";

type Params = { params: Promise<{ postId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { ctx } = await requireAuth(request);
    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO or Platform Admin can verify posts", 403));
    }

    const { postId } = await params;
    const post = await prisma.institutionPost.findUnique({
      where: { id: postId },
      include: { institution: { select: { province: true } } },
    });
    if (!post) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Post not found", 404));
    }

    if (ctx.role !== "QCTO_SUPER_ADMIN" && ctx.role !== "PLATFORM_ADMIN") {
      const user = await prisma.user.findUnique({
        where: { user_id: ctx.userId },
        select: { assigned_provinces: true, default_province: true },
      });
      const provinces: string[] = user?.assigned_provinces ?? (user?.default_province ? [user.default_province] : []);
      if (provinces.length > 0 && !provinces.includes(post.institution.province)) {
        return fail(new AppError(ERROR_CODES.FORBIDDEN, "You do not have access to this institution's province", 403));
      }
    }

    const body = await request.json();
    const is_verified = typeof body?.is_verified === "boolean" ? body.is_verified : undefined;
    if (is_verified === undefined) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "is_verified (boolean) is required", 400));
    }

    const updated = await prisma.institutionPost.update({
      where: { id: postId },
      data: { is_verified },
    });

    return Response.json(updated);
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("PATCH /api/qcto/posts/[postId]/verify error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to update post verification", 500));
  }
}

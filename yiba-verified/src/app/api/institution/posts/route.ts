/**
 * POST /api/institution/posts - Create post (max 2 per institution per rolling 7 days)
 * GET /api/institution/posts - List posts for current institution
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";

const POSTS_PER_WEEK = 2;

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);
    if (!ctx.institutionId) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "User is not associated with an institution", 403));
    }
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only institution staff can list posts", 403));
    }

    const posts = await prisma.institutionPost.findMany({
      where: { institution_id: ctx.institutionId },
      orderBy: { created_at: "desc" },
    });

    return Response.json({ items: posts });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/institution/posts error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to list posts", 500));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);
    if (!ctx.institutionId) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "User is not associated with an institution", 403));
    }
    if (ctx.role !== "PLATFORM_ADMIN" && !hasCap(ctx.role, "CAN_MANAGE_PUBLIC_PROFILE")) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "You do not have permission to create posts", 403));
    }

    const body = await request.json();
    const type = body?.type === "ACHIEVEMENT" || body?.type === "UPDATE" ? body.type : "UPDATE";
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const bodyText = typeof body?.body === "string" ? body.body.trim() : "";
    const image_url = typeof body?.image_url === "string" ? body.image_url.trim() || null : null;
    const video_url = typeof body?.video_url === "string" ? body.video_url.trim() || null : null;

    if (!title || title.length < 1) return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Title is required", 400));
    if (!bodyText) return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Body is required", 400));

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const count = await prisma.institutionPost.count({
      where: { institution_id: ctx.institutionId, created_at: { gte: weekAgo } },
    });
    if (count >= POSTS_PER_WEEK) {
      return fail(
        new AppError(ERROR_CODES.VALIDATION_ERROR, `Maximum ${POSTS_PER_WEEK} posts per week. You can post again after the rolling 7-day window.`, 429)
      );
    }

    const post = await prisma.institutionPost.create({
      data: {
        institution_id: ctx.institutionId,
        type,
        title,
        body: bodyText,
        image_url,
        video_url,
        is_verified: false,
      },
    });

    return Response.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("POST /api/institution/posts error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to create post", 500));
  }
}

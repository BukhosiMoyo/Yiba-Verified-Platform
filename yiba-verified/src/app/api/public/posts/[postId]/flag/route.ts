/**
 * POST /api/public/posts/[postId]/flag - Flag a post (auth required). One flag per user per post.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/context";

type Params = { params: Promise<{ postId: string }> };

const VALID_REASONS = ["MISLEADING", "FAKE", "SPAM", "OTHER"] as const;

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { ctx } = await requireAuth(request);
    const { postId } = await params;
    if (!postId?.trim()) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Post ID is required", 400));
    }

    const post = await prisma.institutionPost.findUnique({
      where: { id: postId.trim() },
      select: { id: true },
    });

    if (!post) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Post not found", 404));
    }

    const body = await request.json();
    const reason = typeof body?.reason === "string" ? body.reason.toUpperCase() : "";
    const details = typeof body?.details === "string" ? body.details.trim() : null;

    if (!VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, `Reason must be one of: ${VALID_REASONS.join(", ")}`, 400));
    }

    await prisma.institutionPostFlag.upsert({
      where: {
        post_id_user_id: { post_id: postId.trim(), user_id: ctx.userId },
      },
      create: {
        post_id: postId.trim(),
        user_id: ctx.userId,
        reason: reason as (typeof VALID_REASONS)[number],
        details,
      },
      update: { reason: reason as (typeof VALID_REASONS)[number], details: details ?? undefined },
    });

    return Response.json({ success: true, message: "Flag submitted." }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("POST /api/public/posts/[postId]/flag error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to submit flag", 500));
  }
}

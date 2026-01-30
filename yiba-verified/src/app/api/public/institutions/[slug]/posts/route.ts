/**
 * GET /api/public/institutions/[slug]/posts - List posts for public profile (paginated)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    if (!slug?.trim()) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Slug is required", 400));
    }

    const profile = await prisma.institutionPublicProfile.findFirst({
      where: { slug: slug.trim(), is_public: true },
      select: { institution_id: true },
    });

    if (!profile) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Institution profile not found or not public", 404));
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.institutionPost.findMany({
        where: { institution_id: profile.institution_id },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.institutionPost.count({ where: { institution_id: profile.institution_id } }),
    ]);

    return Response.json({
      items: posts.map((p) => ({
        id: p.id,
        type: p.type,
        title: p.title,
        body: p.body,
        image_url: p.image_url,
        video_url: p.video_url,
        is_verified: p.is_verified,
        created_at: p.created_at,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/public/institutions/[slug]/posts error:", error);
    return fail(error instanceof AppError ? error : new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to load posts", 500));
  }
}

/**
 * GET /api/public/institutions/[slug]/reviews - List PUBLISHED reviews (paginated)
 * POST /api/public/institutions/[slug]/reviews - Submit review (optional auth; logged-in = PUBLISHED, public = PENDING)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getServerSession } from "@/lib/get-server-session";
import { checkRateLimit, RATE_LIMITS } from "@/lib/api/rateLimit";
import { refreshInstitutionReviewCache } from "@/lib/institutionReviewCache";

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

    const [reviews, total] = await Promise.all([
      prisma.institutionReview.findMany({
        where: { institution_id: profile.institution_id, status: "PUBLISHED" },
        select: {
          id: true,
          rating: true,
          comment: true,
          status: true,
          created_at: true,
          user_id: true,
          reviewer_name: true,
        },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.institutionReview.count({ where: { institution_id: profile.institution_id, status: "PUBLISHED" } }),
    ]);

    const items = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      verified_reviewer: !!r.user_id,
      reviewer_name: r.user_id ? null : r.reviewer_name,
      created_at: r.created_at,
    }));

    return Response.json({ items, total, page, limit });
  } catch (error) {
    console.error("GET /api/public/institutions/[slug]/reviews error:", error);
    return fail(error instanceof AppError ? error : new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to load reviews", 500));
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.STRICT);
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { "Retry-After": String(retryAfter), "Content-Type": "application/json" } }
      );
    }

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

    const session = await getServerSession();
    const body = await request.json();
    const rating = typeof body?.rating === "number" ? body.rating : parseInt(String(body?.rating), 10);
    const comment = typeof body?.comment === "string" ? body.comment.trim() : null;
    const reviewer_name = typeof body?.reviewer_name === "string" ? body.reviewer_name.trim() : null;
    const reviewer_email = typeof body?.reviewer_email === "string" ? body.reviewer_email.trim() : null;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Rating must be 1–5", 400));
    }

    const isLoggedIn = !!session?.user;
    const userId = (session?.user as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? null;
    const status = isLoggedIn ? "PUBLISHED" : "PENDING";

    const review = await prisma.institutionReview.create({
      data: {
        institution_id: profile.institution_id,
        user_id: userId || null,
        reviewer_name: isLoggedIn ? null : reviewer_name || null,
        reviewer_email: isLoggedIn ? null : reviewer_email || null,
        rating,
        comment: comment || null,
        status,
      },
    });

    await refreshInstitutionReviewCache(profile.institution_id).catch((err) =>
      console.error("refreshInstitutionReviewCache failed:", err)
    );

    return Response.json(
      {
        success: true,
        id: review.id,
        status,
        message: status === "PENDING" ? "Review submitted for approval." : "Review submitted.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/public/institutions/[slug]/reviews error:", error);
    return fail(error instanceof AppError ? error : new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to submit review", 500));
  }
}

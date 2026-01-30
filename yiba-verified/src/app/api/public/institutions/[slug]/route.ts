/**
 * GET /api/public/institutions/[slug]
 * Public profile by slug; only if is_public=true. Exposes safe fields only.
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
      include: {
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
            province: true,
            physical_address: true,
            delivery_modes: true,
            status: true,
          },
        },
      },
    });

    if (!profile) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Institution profile not found or not public", 404));
    }

    const [avgRating, reviewCount, qualifications] = await Promise.all([
      prisma.institutionReview.aggregate({
        where: { institution_id: profile.institution_id, status: "PUBLISHED" },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.institutionReview.count({ where: { institution_id: profile.institution_id, status: "PUBLISHED" } }),
      prisma.readiness.findMany({
        where: { institution_id: profile.institution_id, deleted_at: null },
        select: { qualification_title: true, qualification_registry: { select: { id: true, name: true, nqf_level: true } } },
      }),
    ]);

    return Response.json({
      id: profile.id,
      slug: profile.slug,
      is_public: profile.is_public,
      tagline: profile.tagline,
      about: profile.about,
      logo_url: profile.logo_url,
      banner_url: profile.banner_url,
      contact_visibility: profile.contact_visibility,
      contact_email: profile.contact_visibility === "PUBLIC" ? profile.contact_email : null,
      contact_phone: profile.contact_visibility === "PUBLIC" ? profile.contact_phone : null,
      apply_mode: profile.apply_mode,
      apply_url: profile.apply_url,
      verification_status: profile.verification_status,
      featured_until: profile.featured_until,
      featured_priority: profile.featured_priority,
      updated_at: profile.updated_at,
      institution: profile.institution,
      rating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null,
      review_count: reviewCount,
      qualifications: qualifications.map((q) => ({
        title: q.qualification_registry?.name || q.qualification_title,
        nqf_level: q.qualification_registry?.nqf_level,
      })),
    });
  } catch (error) {
    console.error("GET /api/public/institutions/[slug] error:", error);
    return fail(error instanceof AppError ? error : new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to load profile", 500));
  }
}

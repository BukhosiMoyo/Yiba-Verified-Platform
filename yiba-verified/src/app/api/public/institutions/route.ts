/**
 * GET /api/public/institutions
 * Public directory: list institutions with is_public=true.
 * Query: q, province, qualification, rating (min), sort, page, limit, lat, lon (for sort=near)
 */

import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { PROVINCES } from "@/lib/provinces";
import { haversineKm } from "@/lib/distance";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const province = searchParams.get("province")?.trim() || "";
    const qualification = searchParams.get("qualification")?.trim() || "";
    const ratingParam = searchParams.get("rating");
    const sort = searchParams.get("sort") || "recent";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)));
    const offset = (page - 1) * limit;
    const minRating = ratingParam ? parseInt(ratingParam, 10) : null;
    const userLat = searchParams.get("lat") != null ? parseFloat(searchParams.get("lat")!) : null;
    const userLon = searchParams.get("lon") != null ? parseFloat(searchParams.get("lon")!) : null;
    const sortNear = sort === "near" && userLat != null && userLon != null && Number.isFinite(userLat) && Number.isFinite(userLon);

    const where: Prisma.InstitutionPublicProfileWhereInput = {
      is_public: true,
      institution: { deleted_at: null },
    };

    if (province && PROVINCES.includes(province as (typeof PROVINCES)[number])) {
      (where.institution as Record<string, unknown>) = { ...(where.institution as object), province };
    }

    if (q.length >= 2) {
      where.AND = [
        {
          OR: [
            { slug: { contains: q, mode: "insensitive" } },
            { tagline: { contains: q, mode: "insensitive" } },
            { about: { contains: q, mode: "insensitive" } },
            { institution: { legal_name: { contains: q, mode: "insensitive" } } },
            { institution: { trading_name: { contains: q, mode: "insensitive" } } },
            { institution: { province: { contains: q, mode: "insensitive" } } },
          ],
        },
      ];
    }

    if (qualification.length >= 2) {
      (where.institution as Record<string, unknown>) = {
        ...(where.institution as object),
        readinessRecords: {
          some: {
            deleted_at: null,
            OR: [
              { qualification_title: { contains: qualification, mode: "insensitive" } },
              { qualification_registry: { name: { contains: qualification, mode: "insensitive" } } },
            ],
          },
        },
      };
    }

    if (minRating != null && minRating >= 1 && minRating <= 5) {
      where.cached_rating_avg = { gte: minRating };
    }
    if (sort === "rating" || sort === "reviews") {
      where.cached_rating_avg = { ...(where.cached_rating_avg as object), not: null };
    }
    if (sortNear) {
      where.latitude = { not: null };
      where.longitude = { not: null };
    }

    const orderBy: Prisma.InstitutionPublicProfileOrderByWithRelationInput[] =
      sortNear
        ? [{ updated_at: "desc" }] // temporary; we re-sort by distance below
        : sort === "featured"
          ? [{ featured_until: "desc" }, { featured_priority: "desc" }, { updated_at: "desc" }]
          : sort === "rating"
            ? [{ cached_rating_avg: "desc" }, { cached_review_count: "desc" }, { updated_at: "desc" }]
            : sort === "reviews"
              ? [{ cached_review_count: "desc" }, { cached_rating_avg: "desc" }, { updated_at: "desc" }]
              : [{ updated_at: "desc" }];

    const includeInst = {
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
    } as const;
    type ProfileWithInst = Prisma.InstitutionPublicProfileGetPayload<{ include: typeof includeInst }>;
    let profiles: ProfileWithInst[];
    let total: number;

    if (sortNear) {
      const maxNear = 500; // cap for in-memory sort
      const all = await prisma.institutionPublicProfile.findMany({
        where,
        include: includeInst,
        orderBy: [{ updated_at: "desc" }],
        take: maxNear,
      });
      total = all.length;
      const withDistance = all
        .map((p) => ({
          profile: p,
          distance_km: haversineKm(
            userLat!,
            userLon!,
            p.latitude ?? 0,
            p.longitude ?? 0
          ),
        }))
        .sort((a, b) => a.distance_km - b.distance_km);
      profiles = withDistance.slice(offset, offset + limit).map((x) => x.profile);
    } else {
      const [list, count] = await Promise.all([
        prisma.institutionPublicProfile.findMany({
          where,
          include: includeInst,
          orderBy,
          take: limit,
          skip: offset,
        }),
        prisma.institutionPublicProfile.count({ where }),
      ]);
      profiles = list;
      total = count;
    }

    const items: Array<{
      id: string;
      slug: string;
      tagline: string | null;
      logo_url: string | null;
      is_public: boolean;
      verification_status: string;
      featured_until: Date | null;
      featured_priority: number;
      updated_at: Date;
      institution: { institution_id: string; legal_name: string; trading_name: string | null; province: string; physical_address: string; delivery_modes: string[]; status: string };
      rating: number | null;
      review_count: number;
      qualification_chips: string[];
      latitude: number | null;
      longitude: number | null;
      distance_km?: number | null;
    }> = [];

    for (const p of profiles) {
      const recs = await prisma.readiness.findMany({
        where: { institution_id: p.institution_id, deleted_at: null },
        select: { qualification_title: true, qualification_registry: { select: { name: true } } },
        take: 5,
      });
      const chips = recs.map((r) => r.qualification_registry?.name || r.qualification_title);
      const rating =
        p.cached_rating_avg != null ? Number(p.cached_rating_avg) : null;
      const review_count = p.cached_review_count ?? 0;
      const lat = p.latitude != null ? Number(p.latitude) : null;
      const lon = p.longitude != null ? Number(p.longitude) : null;
      const distance_km =
        sortNear && userLat != null && userLon != null && lat != null && lon != null
          ? haversineKm(userLat, userLon, lat, lon)
          : undefined;

      items.push({
        id: p.id,
        slug: p.slug,
        tagline: p.tagline,
        logo_url: p.logo_url,
        is_public: p.is_public,
        verification_status: p.verification_status,
        featured_until: p.featured_until,
        featured_priority: p.featured_priority,
        updated_at: p.updated_at,
        institution: p.institution,
        rating,
        review_count,
        qualification_chips: chips,
        latitude: lat,
        longitude: lon,
        ...(distance_km != null && { distance_km }),
      });
    }

    return Response.json({
      count: items.length,
      total,
      page,
      limit,
      items,
    });
  } catch (error) {
    console.error("GET /api/public/institutions error:", error);
    return fail(error instanceof AppError ? error : new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to list institutions", 500));
  }
}

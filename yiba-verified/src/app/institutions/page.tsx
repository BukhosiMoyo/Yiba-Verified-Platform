import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GradientShell } from "@/components/shared/Backgrounds";
import { PROVINCES } from "@/lib/provinces";
import { haversineKm } from "@/lib/distance";
import { Building2 } from "lucide-react";
import { InstitutionsDirectoryClient } from "./InstitutionsDirectoryClient";
import { InstitutionsListAndMap } from "./InstitutionsListAndMap";

export const metadata: Metadata = {
  title: "Find an accredited institution",
  description:
    "Browse accredited institutions on Yiba Verified. Search by name, location, or qualification.",
  openGraph: {
    title: "Find an accredited institution | Yiba Verified",
    description: "Browse accredited institutions. Search by name, location, or qualification.",
    type: "website",
  },
};

export const revalidate = 300;

type PageProps = { searchParams: Promise<{ q?: string; province?: string; sort?: string; rating?: string; page?: string; lat?: string; lon?: string }> };

async function getInstitutions(searchParams: { q?: string; province?: string; sort?: string; rating?: string; page?: string; lat?: string; lon?: string }) {
  const q = searchParams.q?.trim() || "";
  const province = searchParams.province?.trim() || "";
  const sort = searchParams.sort || "recent";
  const ratingParam = searchParams.rating;
  const minRating = ratingParam ? parseInt(ratingParam, 10) : null;
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const limit = 24;
  const offset = (page - 1) * limit;
  const userLat = searchParams.lat != null ? parseFloat(searchParams.lat) : null;
  const userLon = searchParams.lon != null ? parseFloat(searchParams.lon) : null;
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
    sort === "featured"
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
    const maxNear = 500;
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
        distance_km: haversineKm(userLat!, userLon!, p.latitude ?? 0, p.longitude ?? 0),
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
    slug: string;
    tagline: string | null;
    logo_url: string | null;
    banner_url: string | null;
    verification_status: string;
    featured_until: Date | null;
    institution: { legal_name: string; trading_name: string | null; province: string; physical_address: string };
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
      take: 8,
    });
    const lat = p.latitude != null ? Number(p.latitude) : null;
    const lon = p.longitude != null ? Number(p.longitude) : null;
    const distance_km =
      sortNear && userLat != null && userLon != null && lat != null && lon != null
        ? haversineKm(userLat, userLon, lat, lon)
        : undefined;
    items.push({
      slug: p.slug,
      tagline: p.tagline,
      logo_url: p.logo_url,
      banner_url: p.banner_url,
      verification_status: p.verification_status,
      featured_until: p.featured_until,
      institution: p.institution,
      rating: p.cached_rating_avg != null ? Number(p.cached_rating_avg) : null,
      review_count: p.cached_review_count ?? 0,
      qualification_chips: recs.map((r) => r.qualification_registry?.name || r.qualification_title),
      latitude: lat,
      longitude: lon,
      ...(distance_km != null && { distance_km }),
    });
  }

  return { items, total, page, limit };
}

export default async function InstitutionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { items, total, page, limit } = await getInstitutions(params);
  const name = (params.q || "").trim();
  const province = (params.province || "").trim();
  const sort = (params.sort || "recent").trim();
  const rating = (params.rating || "").trim();
  const lat = (params.lat || "").trim();
  const lon = (params.lon || "").trim();

  const baseQuery: Record<string, string> = {};
  if (params.q) baseQuery.q = params.q;
  if (params.province) baseQuery.province = params.province;
  if (params.sort) baseQuery.sort = params.sort;
  if (params.rating) baseQuery.rating = params.rating;
  if (lat) baseQuery.lat = lat;
  if (lon) baseQuery.lon = lon;
  const prevHref = `/institutions?${new URLSearchParams({ ...baseQuery, page: String(page - 1) }).toString()}`;
  const nextHref = `/institutions?${new URLSearchParams({ ...baseQuery, page: String(page + 1) }).toString()}`;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <>
        <GradientShell as="section" className="py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Find an accredited institution
            </h1>
            <p className="mt-2 text-muted-foreground">
              Search institution, location, or qualification…
            </p>
            <InstitutionsDirectoryClient
              initialQ={name}
              initialProvince={province}
              initialSort={sort}
              initialRating={rating}
              initialPage={page}
              initialLat={lat}
              initialLon={lon}
              total={total}
              page={page}
              limit={limit}
            />
          </div>
        </GradientShell>

        <section className="border-t border-border bg-background py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {items.length > 0 && (
              <p className="mb-6 text-sm text-muted-foreground" role="status" aria-live="polite">
                Showing {start}–{end} of {total} institutions
              </p>
            )}
            {items.length === 0 ? (
              <div
                className="rounded-xl border border-border bg-card p-12 text-center"
                role="status"
                aria-live="polite"
              >
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
                <p className="mt-4 text-lg font-medium text-foreground">No institutions found</p>
                <p className="mt-1 text-muted-foreground">Try a different search or filter.</p>
              </div>
            ) : (
              <InstitutionsListAndMap
                items={items}
                total={total}
                page={page}
                limit={limit}
                start={start}
                end={end}
                prevHref={prevHref}
                nextHref={nextHref}
              />
            )}
          </div>
        </section>
    </>
  );
}

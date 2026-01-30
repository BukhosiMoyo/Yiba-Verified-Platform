/**
 * Updates InstitutionPublicProfile cached_rating_avg and cached_review_count
 * for the given institution. Call after creating, updating, or deleting a review,
 * or when review status changes (e.g. PENDING -> PUBLISHED).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function refreshInstitutionReviewCache(institutionId: string): Promise<void> {
  const agg = await prisma.institutionReview.aggregate({
    where: { institution_id: institutionId, status: "PUBLISHED" },
    _avg: { rating: true },
    _count: true,
  });

  const avgRating =
    agg._avg.rating != null ? new Prisma.Decimal(Math.round(agg._avg.rating * 100) / 100) : null;
  const reviewCount = agg._count;

  await prisma.institutionPublicProfile.updateMany({
    where: { institution_id: institutionId },
    data: {
      cached_rating_avg: avgRating,
      cached_review_count: reviewCount,
    },
  });
}

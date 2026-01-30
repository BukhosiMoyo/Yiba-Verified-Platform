-- AlterTable
ALTER TABLE "InstitutionPublicProfile" ADD COLUMN "cached_rating_avg" DECIMAL(3,2),
ADD COLUMN "cached_review_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "InstitutionPublicProfile_cached_rating_avg_idx" ON "InstitutionPublicProfile"("cached_rating_avg");

-- CreateIndex
CREATE INDEX "InstitutionPublicProfile_cached_review_count_idx" ON "InstitutionPublicProfile"("cached_review_count");

-- Backfill: set cached_rating_avg and cached_review_count from InstitutionReview (PUBLISHED only)
WITH agg AS (
  SELECT
    "institution_id",
    ROUND(AVG("rating")::numeric, 2) AS avg_rating,
    COUNT(*)::integer AS review_count
  FROM "InstitutionReview"
  WHERE "status" = 'PUBLISHED'
  GROUP BY "institution_id"
)
UPDATE "InstitutionPublicProfile" p
SET
  "cached_rating_avg" = agg.avg_rating,
  "cached_review_count" = agg.review_count
FROM agg
WHERE p."institution_id" = agg."institution_id";


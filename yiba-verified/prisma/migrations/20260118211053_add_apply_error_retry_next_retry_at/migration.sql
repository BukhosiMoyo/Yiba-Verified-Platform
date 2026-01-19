-- AlterTable
ALTER TABLE "FeatureChange" ADD COLUMN     "apply_error" TEXT,
ADD COLUMN     "next_retry_at" TIMESTAMPTZ,
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "FeatureChange_next_retry_at_idx" ON "FeatureChange"("next_retry_at");

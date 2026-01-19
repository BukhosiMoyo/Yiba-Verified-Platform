-- AlterTable
ALTER TABLE "FeatureChange" ADD COLUMN "rollback_of_change_id" TEXT,
ADD COLUMN "is_rollback" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "FeatureChange_rollback_of_change_id_idx" ON "FeatureChange"("rollback_of_change_id");

-- AddForeignKey
ALTER TABLE "FeatureChange" ADD CONSTRAINT "FeatureChange_rollback_of_change_id_fkey" FOREIGN KEY ("rollback_of_change_id") REFERENCES "FeatureChange"("change_id") ON DELETE SET NULL ON UPDATE CASCADE;

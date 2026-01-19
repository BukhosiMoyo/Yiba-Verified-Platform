-- AlterEnum
ALTER TYPE "FeatureFlagAuditAction" ADD VALUE 'ROLLBACK';

-- AlterTable
ALTER TABLE "FeatureFlagAudit" ADD COLUMN     "human_lines" JSONB,
ADD COLUMN     "human_summary" TEXT;

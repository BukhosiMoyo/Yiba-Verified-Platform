-- CreateEnum
CREATE TYPE "FeatureChangeScope" AS ENUM ('GLOBAL', 'ROLE', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "FeatureChangeStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'SCHEDULED', 'APPLIED', 'FAILED', 'ROLLED_BACK');

-- CreateEnum
CREATE TYPE "FeatureChangeApprovalDecision" AS ENUM ('APPROVE', 'REJECT');

-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'FEATURE_CHANGE';

-- CreateTable
CREATE TABLE "FeatureChange" (
    "change_id" TEXT NOT NULL,
    "scope" "FeatureChangeScope" NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "target_ref" TEXT,
    "status" "FeatureChangeStatus" NOT NULL DEFAULT 'DRAFT',
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT NOT NULL,
    "diff_json" JSONB NOT NULL,
    "approvals_required" INTEGER NOT NULL DEFAULT 1,
    "requested_by_user_id" TEXT NOT NULL,
    "effective_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "applied_at" TIMESTAMPTZ,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureChange_pkey" PRIMARY KEY ("change_id")
);

-- CreateTable
CREATE TABLE "FeatureChangeApproval" (
    "approval_id" TEXT NOT NULL,
    "change_id" TEXT NOT NULL,
    "approved_by_user_id" TEXT NOT NULL,
    "decision" "FeatureChangeApprovalDecision" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureChangeApproval_pkey" PRIMARY KEY ("approval_id")
);

-- CreateIndex
CREATE INDEX "FeatureChange_status_idx" ON "FeatureChange"("status");

-- CreateIndex
CREATE INDEX "FeatureChange_scope_idx" ON "FeatureChange"("scope");

-- CreateIndex
CREATE INDEX "FeatureChange_requested_by_user_id_idx" ON "FeatureChange"("requested_by_user_id");

-- CreateIndex
CREATE INDEX "FeatureChange_created_at_idx" ON "FeatureChange"("created_at");

-- CreateIndex
CREATE INDEX "FeatureChangeApproval_change_id_idx" ON "FeatureChangeApproval"("change_id");

-- CreateIndex
CREATE INDEX "FeatureChangeApproval_approved_by_user_id_idx" ON "FeatureChangeApproval"("approved_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureChangeApproval_change_id_approved_by_user_id_key" ON "FeatureChangeApproval"("change_id", "approved_by_user_id");

-- AddForeignKey
ALTER TABLE "FeatureChange" ADD CONSTRAINT "FeatureChange_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureChangeApproval" ADD CONSTRAINT "FeatureChangeApproval_change_id_fkey" FOREIGN KEY ("change_id") REFERENCES "FeatureChange"("change_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureChangeApproval" ADD CONSTRAINT "FeatureChangeApproval_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

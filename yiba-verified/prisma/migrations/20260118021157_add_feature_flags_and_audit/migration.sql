/*
  Warnings:

  - A unique constraint covering the columns `[token_hash]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "FeatureFlagAuditScope" AS ENUM ('GLOBAL', 'ROLE', 'TENANT', 'RESET');

-- CreateEnum
CREATE TYPE "FeatureFlagAuditAction" AS ENUM ('ENABLE', 'DISABLE', 'UPDATE', 'RESET');

-- CreateEnum
CREATE TYPE "FeatureFlagAuditStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "feature_key" TEXT NOT NULL,
    "enabled_global" BOOLEAN NOT NULL DEFAULT true,
    "enabled_roles" JSONB,
    "enabled_tenants" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("feature_key")
);

-- CreateTable
CREATE TABLE "FeatureFlagAudit" (
    "id" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "changed_by_user_id" TEXT NOT NULL,
    "changed_by_name" TEXT,
    "changed_by_role" "UserRole" NOT NULL,
    "scope" "FeatureFlagAuditScope" NOT NULL,
    "role_target" TEXT,
    "tenant_id" TEXT,
    "action" "FeatureFlagAuditAction" NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "status" "FeatureFlagAuditStatus" NOT NULL DEFAULT 'SUCCESS',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureFlagAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeatureFlag_enabled_global_idx" ON "FeatureFlag"("enabled_global");

-- CreateIndex
CREATE INDEX "FeatureFlagAudit_feature_key_idx" ON "FeatureFlagAudit"("feature_key");

-- CreateIndex
CREATE INDEX "FeatureFlagAudit_created_at_idx" ON "FeatureFlagAudit"("created_at");

-- CreateIndex
CREATE INDEX "FeatureFlagAudit_changed_by_user_id_idx" ON "FeatureFlagAudit"("changed_by_user_id");

-- CreateIndex
CREATE INDEX "FeatureFlagAudit_scope_idx" ON "FeatureFlagAudit"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_hash_key" ON "Invite"("token_hash");

-- AddForeignKey
ALTER TABLE "FeatureFlagAudit" ADD CONSTRAINT "FeatureFlagAudit_feature_key_fkey" FOREIGN KEY ("feature_key") REFERENCES "FeatureFlag"("feature_key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlagAudit" ADD CONSTRAINT "FeatureFlagAudit_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

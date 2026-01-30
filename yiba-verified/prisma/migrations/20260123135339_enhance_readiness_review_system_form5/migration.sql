/*
  Warnings:

  - You are about to drop the column `facilitators_notes` on the `Readiness` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QCTOOrg" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Readiness" DROP COLUMN "facilitators_notes",
ADD COLUMN     "credits" INTEGER,
ADD COLUMN     "intended_learner_intake" INTEGER,
ADD COLUMN     "knowledge_components_complete" BOOLEAN,
ADD COLUMN     "learning_material_coverage_percentage" INTEGER,
ADD COLUMN     "learning_material_nqf_aligned" BOOLEAN,
ADD COLUMN     "learning_material_quality_verified" BOOLEAN,
ADD COLUMN     "lmis_access_control_description" TEXT,
ADD COLUMN     "lmis_data_storage_description" TEXT,
ADD COLUMN     "lmis_functional" BOOLEAN,
ADD COLUMN     "lmis_popia_compliant" BOOLEAN,
ADD COLUMN     "occupational_category" TEXT,
ADD COLUMN     "practical_components_complete" BOOLEAN,
ADD COLUMN     "section_completion_data" JSONB,
ADD COLUMN     "section_criteria_responses" JSONB;

-- AlterTable
ALTER TABLE "ReadinessRecommendation" ADD COLUMN     "document_flags" JSONB,
ADD COLUMN     "review_notes" TEXT,
ADD COLUMN     "reviewer_confidence" INTEGER,
ADD COLUMN     "section_scores" JSONB,
ADD COLUMN     "sme_name" TEXT,
ADD COLUMN     "sme_signature" TEXT,
ADD COLUMN     "verification_date" TIMESTAMP(3),
ADD COLUMN     "verifier_remarks" TEXT;

-- CreateTable
CREATE TABLE "InstitutionTrustScore" (
    "score_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "trend" TEXT,
    "explanation" TEXT,
    "factors" JSONB,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionTrustScore_pkey" PRIMARY KEY ("score_id")
);

-- CreateTable
CREATE TABLE "ReadinessSectionReview" (
    "review_id" TEXT NOT NULL,
    "readiness_id" TEXT NOT NULL,
    "section_name" TEXT NOT NULL,
    "criterion_key" TEXT,
    "reviewer_id" TEXT NOT NULL,
    "response" TEXT,
    "mandatory_remarks" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadinessSectionReview_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "DocumentFlag" (
    "flag_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "readiness_id" TEXT,
    "flagged_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FLAGGED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "DocumentFlag_pkey" PRIMARY KEY ("flag_id")
);

-- CreateTable
CREATE TABLE "Facilitator" (
    "facilitator_id" TEXT NOT NULL,
    "readiness_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "id_number" TEXT,
    "qualifications" TEXT,
    "industry_experience" TEXT,
    "is_non_sa" BOOLEAN NOT NULL DEFAULT false,
    "saqa_evaluation_id" TEXT,
    "work_permit_number" TEXT,
    "visa_passport_number" TEXT,
    "contract_document_id" TEXT,
    "cv_document_id" TEXT,
    "qualification_doc_id" TEXT,
    "id_document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facilitator_pkey" PRIMARY KEY ("facilitator_id")
);

-- CreateTable
CREATE TABLE "ImpersonationSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "impersonator_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "ImpersonationSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionTrustScore_institution_id_key" ON "InstitutionTrustScore"("institution_id");

-- CreateIndex
CREATE INDEX "InstitutionTrustScore_institution_id_idx" ON "InstitutionTrustScore"("institution_id");

-- CreateIndex
CREATE INDEX "ReadinessSectionReview_readiness_id_idx" ON "ReadinessSectionReview"("readiness_id");

-- CreateIndex
CREATE INDEX "ReadinessSectionReview_reviewer_id_idx" ON "ReadinessSectionReview"("reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessSectionReview_readiness_id_section_name_criterion__key" ON "ReadinessSectionReview"("readiness_id", "section_name", "criterion_key", "reviewer_id");

-- CreateIndex
CREATE INDEX "DocumentFlag_document_id_idx" ON "DocumentFlag"("document_id");

-- CreateIndex
CREATE INDEX "DocumentFlag_readiness_id_idx" ON "DocumentFlag"("readiness_id");

-- CreateIndex
CREATE INDEX "DocumentFlag_flagged_by_idx" ON "DocumentFlag"("flagged_by");

-- CreateIndex
CREATE INDEX "Facilitator_readiness_id_idx" ON "Facilitator"("readiness_id");

-- CreateIndex
CREATE UNIQUE INDEX "ImpersonationSession_token_key" ON "ImpersonationSession"("token");

-- CreateIndex
CREATE INDEX "ImpersonationSession_token_idx" ON "ImpersonationSession"("token");

-- CreateIndex
CREATE INDEX "ImpersonationSession_impersonator_id_idx" ON "ImpersonationSession"("impersonator_id");

-- CreateIndex
CREATE INDEX "ImpersonationSession_target_user_id_idx" ON "ImpersonationSession"("target_user_id");

-- CreateIndex
CREATE INDEX "ImpersonationSession_status_idx" ON "ImpersonationSession"("status");

-- CreateIndex
CREATE INDEX "ImpersonationSession_expires_at_idx" ON "ImpersonationSession"("expires_at");

-- AddForeignKey
ALTER TABLE "InstitutionTrustScore" ADD CONSTRAINT "InstitutionTrustScore_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessSectionReview" ADD CONSTRAINT "ReadinessSectionReview_readiness_id_fkey" FOREIGN KEY ("readiness_id") REFERENCES "Readiness"("readiness_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessSectionReview" ADD CONSTRAINT "ReadinessSectionReview_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFlag" ADD CONSTRAINT "DocumentFlag_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("document_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFlag" ADD CONSTRAINT "DocumentFlag_readiness_id_fkey" FOREIGN KEY ("readiness_id") REFERENCES "Readiness"("readiness_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFlag" ADD CONSTRAINT "DocumentFlag_flagged_by_fkey" FOREIGN KEY ("flagged_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facilitator" ADD CONSTRAINT "Facilitator_readiness_id_fkey" FOREIGN KEY ("readiness_id") REFERENCES "Readiness"("readiness_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_impersonator_id_fkey" FOREIGN KEY ("impersonator_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

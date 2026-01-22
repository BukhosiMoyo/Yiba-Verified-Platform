/*
  Warnings:

  - Made the column `disability_status` on table `Learner` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing NULL values before making column required
UPDATE "Learner" 
SET "disability_status" = 'NO' 
WHERE "disability_status" IS NULL;

-- AlterTable
ALTER TABLE "Learner" ADD COLUMN     "address" TEXT,
ADD COLUMN     "ethnicity" TEXT,
ADD COLUMN     "next_of_kin_address" TEXT,
ADD COLUMN     "next_of_kin_name" TEXT,
ADD COLUMN     "next_of_kin_phone" TEXT,
ADD COLUMN     "next_of_kin_relationship" TEXT,
ADD COLUMN     "province" TEXT,
ALTER COLUMN "disability_status" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboarding_completed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "personal_info" JSONB,
    "address_info" JSONB,
    "next_of_kin_info" JSONB,
    "additional_info" JSONB,
    "popia_consent" BOOLEAN DEFAULT false,
    "popia_consent_date" TIMESTAMP(3),
    "past_qualifications" JSONB,
    "prior_learning" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastQualification" (
    "id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "institution" TEXT,
    "year_completed" INTEGER,
    "document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PastQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorLearning" (
    "id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "institution" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriorLearning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_user_id_key" ON "OnboardingProgress"("user_id");

-- CreateIndex
CREATE INDEX "OnboardingProgress_user_id_idx" ON "OnboardingProgress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PastQualification_document_id_key" ON "PastQualification"("document_id");

-- CreateIndex
CREATE INDEX "PastQualification_learner_id_idx" ON "PastQualification"("learner_id");

-- CreateIndex
CREATE INDEX "PriorLearning_learner_id_idx" ON "PriorLearning"("learner_id");

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastQualification" ADD CONSTRAINT "PastQualification_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "Learner"("learner_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastQualification" ADD CONSTRAINT "PastQualification_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("document_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorLearning" ADD CONSTRAINT "PriorLearning_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "Learner"("learner_id") ON DELETE CASCADE ON UPDATE CASCADE;

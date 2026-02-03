/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Qualification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[saqa_id]` on the table `Qualification` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[curriculum_code]` on the table `Qualification` will be added. If there are existing duplicate values, this will fail.
  - Made the column `code` on table `Qualification` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "QualificationType" AS ENUM ('OCCUPATIONAL_CERTIFICATE', 'SKILL_PROGRAMME', 'LEARNERSHIP', 'APPRENTICESHIP', 'UNIT_STANDARD', 'SHORT_COURSE', 'OTHER');

-- CreateEnum
CREATE TYPE "StudyMode" AS ENUM ('ON_SITE', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('WEEKS', 'MONTHS', 'YEARS');

-- CreateEnum
CREATE TYPE "RegulatoryBody" AS ENUM ('QCTO', 'SETA', 'DHET', 'OTHER');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('EXAM', 'PRACTICAL', 'PORTFOLIO', 'MIXED');

-- AlterEnum
ALTER TYPE "QualificationStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "Qualification" ADD COLUMN     "assessment_type" "AssessmentType",
ADD COLUMN     "career_outcomes" TEXT[],
ADD COLUMN     "credits" INTEGER,
ADD COLUMN     "curriculum_code" TEXT,
ADD COLUMN     "duration_unit" "DurationUnit" NOT NULL DEFAULT 'MONTHS',
ADD COLUMN     "duration_value" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "entry_requirements" TEXT,
ADD COLUMN     "language_of_delivery" TEXT,
ADD COLUMN     "modules" TEXT[],
ADD COLUMN     "nqf_level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "regulatory_body" "RegulatoryBody",
ADD COLUMN     "saqa_id" TEXT,
ADD COLUMN     "seta" TEXT,
ADD COLUMN     "status" "QualificationStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "study_mode" "StudyMode" NOT NULL DEFAULT 'ON_SITE',
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "type" "QualificationType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "workplace_hours" INTEGER,
ADD COLUMN     "workplace_required" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "code" SET NOT NULL;

-- AlterTable
ALTER TABLE "Readiness" ADD COLUMN     "qualification_id" TEXT,
ADD COLUMN     "qualification_snapshot_json" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Qualification_code_key" ON "Qualification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Qualification_saqa_id_key" ON "Qualification"("saqa_id");

-- CreateIndex
CREATE UNIQUE INDEX "Qualification_curriculum_code_key" ON "Qualification"("curriculum_code");

-- CreateIndex
CREATE INDEX "Qualification_status_idx" ON "Qualification"("status");

-- CreateIndex
CREATE INDEX "Qualification_saqa_id_idx" ON "Qualification"("saqa_id");

-- CreateIndex
CREATE INDEX "Readiness_qualification_id_idx" ON "Readiness"("qualification_id");

-- AddForeignKey
ALTER TABLE "Readiness" ADD CONSTRAINT "Readiness_qualification_id_fkey" FOREIGN KEY ("qualification_id") REFERENCES "Qualification"("qualification_id") ON DELETE SET NULL ON UPDATE CASCADE;

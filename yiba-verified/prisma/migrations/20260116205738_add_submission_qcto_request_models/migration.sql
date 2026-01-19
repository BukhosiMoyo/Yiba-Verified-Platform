-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED_FOR_CORRECTION');

-- CreateEnum
CREATE TYPE "QCTORequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "SubmissionResourceType" AS ENUM ('READINESS', 'LEARNER', 'ENROLMENT', 'DOCUMENT', 'INSTITUTION');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "related_qcto_request_id" TEXT;

-- CreateTable
CREATE TABLE "Submission" (
    "submission_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "title" TEXT,
    "submission_type" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "submitted_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("submission_id")
);

-- CreateTable
CREATE TABLE "SubmissionResource" (
    "resource_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "resource_type" "SubmissionResourceType" NOT NULL,
    "resource_id_value" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "SubmissionResource_pkey" PRIMARY KEY ("resource_id")
);

-- CreateTable
CREATE TABLE "QCTORequest" (
    "request_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "request_type" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "QCTORequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "response_notes" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "QCTORequest_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "QCTORequestResource" (
    "resource_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "resource_type" "SubmissionResourceType" NOT NULL,
    "resource_id_value" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "QCTORequestResource_pkey" PRIMARY KEY ("resource_id")
);

-- CreateIndex
CREATE INDEX "Submission_institution_id_idx" ON "Submission"("institution_id");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_submitted_at_idx" ON "Submission"("submitted_at");

-- CreateIndex
CREATE INDEX "Submission_submitted_by_idx" ON "Submission"("submitted_by");

-- CreateIndex
CREATE INDEX "Submission_reviewed_by_idx" ON "Submission"("reviewed_by");

-- CreateIndex
CREATE INDEX "SubmissionResource_submission_id_idx" ON "SubmissionResource"("submission_id");

-- CreateIndex
CREATE INDEX "SubmissionResource_resource_type_resource_id_value_idx" ON "SubmissionResource"("resource_type", "resource_id_value");

-- CreateIndex
CREATE INDEX "SubmissionResource_added_by_idx" ON "SubmissionResource"("added_by");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionResource_submission_id_resource_type_resource_id__key" ON "SubmissionResource"("submission_id", "resource_type", "resource_id_value");

-- CreateIndex
CREATE INDEX "QCTORequest_institution_id_idx" ON "QCTORequest"("institution_id");

-- CreateIndex
CREATE INDEX "QCTORequest_requested_by_idx" ON "QCTORequest"("requested_by");

-- CreateIndex
CREATE INDEX "QCTORequest_status_idx" ON "QCTORequest"("status");

-- CreateIndex
CREATE INDEX "QCTORequest_requested_at_idx" ON "QCTORequest"("requested_at");

-- CreateIndex
CREATE INDEX "QCTORequest_reviewed_by_idx" ON "QCTORequest"("reviewed_by");

-- CreateIndex
CREATE INDEX "QCTORequestResource_request_id_idx" ON "QCTORequestResource"("request_id");

-- CreateIndex
CREATE INDEX "QCTORequestResource_resource_type_resource_id_value_idx" ON "QCTORequestResource"("resource_type", "resource_id_value");

-- CreateIndex
CREATE UNIQUE INDEX "QCTORequestResource_request_id_resource_type_resource_id_va_key" ON "QCTORequestResource"("request_id", "resource_type", "resource_id_value");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "fk_audit_submission" FOREIGN KEY ("related_submission_id") REFERENCES "Submission"("submission_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "fk_audit_qcto_request" FOREIGN KEY ("related_qcto_request_id") REFERENCES "QCTORequest"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionResource" ADD CONSTRAINT "SubmissionResource_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "Submission"("submission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionResource" ADD CONSTRAINT "SubmissionResource_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCTORequest" ADD CONSTRAINT "QCTORequest_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCTORequest" ADD CONSTRAINT "QCTORequest_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCTORequest" ADD CONSTRAINT "QCTORequest_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCTORequestResource" ADD CONSTRAINT "QCTORequestResource_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "QCTORequest"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'QCTO_USER', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'STUDENT');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('DRAFT', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('TVET', 'PRIVATE_SDP', 'NGO', 'UNIVERSITY', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('FACE_TO_FACE', 'BLENDED', 'MOBILE');

-- CreateEnum
CREATE TYPE "ReadinessStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED_FOR_CORRECTION', 'REVIEWED', 'RECOMMENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EnrolmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'TRANSFERRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentRelatedEntity" AS ENUM ('INSTITUTION', 'LEARNER', 'READINESS', 'ENROLMENT');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('INSTITUTION', 'USER', 'LEARNER', 'ENROLMENT', 'READINESS', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'FLAGGED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "AuditChangeType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE');

-- CreateTable
CREATE TABLE "Institution" (
    "institution_id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trading_name" TEXT,
    "institution_type" "InstitutionType" NOT NULL,
    "registration_number" TEXT NOT NULL,
    "tax_compliance_pin" TEXT,
    "physical_address" TEXT NOT NULL,
    "postal_address" TEXT,
    "province" TEXT NOT NULL,
    "delivery_modes" "DeliveryMode"[],
    "status" "RecordStatus" NOT NULL DEFAULT 'DRAFT',
    "contact_person_name" TEXT,
    "contact_email" TEXT,
    "contact_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("institution_id")
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL,
    "institution_id" TEXT,
    "role" "UserRole" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "phone" TEXT,
    "password_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Readiness" (
    "readiness_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "qualification_title" TEXT NOT NULL,
    "saqa_id" TEXT NOT NULL,
    "nqf_level" INTEGER,
    "curriculum_code" TEXT NOT NULL,
    "delivery_mode" "DeliveryMode" NOT NULL,
    "readiness_status" "ReadinessStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "submission_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Readiness_pkey" PRIMARY KEY ("readiness_id")
);

-- CreateTable
CREATE TABLE "Learner" (
    "learner_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "user_id" TEXT,
    "national_id" TEXT NOT NULL,
    "alternate_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "gender_code" TEXT NOT NULL,
    "nationality_code" TEXT NOT NULL,
    "home_language_code" TEXT,
    "disability_status" TEXT,
    "popia_consent" BOOLEAN NOT NULL,
    "consent_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Learner_pkey" PRIMARY KEY ("learner_id")
);

-- CreateTable
CREATE TABLE "Enrolment" (
    "enrolment_id" TEXT NOT NULL,
    "learner_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "qualification_title" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "expected_completion_date" TIMESTAMP(3),
    "enrolment_status" "EnrolmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "attendance_percentage" DECIMAL(5,2),
    "assessment_centre_code" TEXT,
    "readiness_status" TEXT,
    "flc_status" TEXT,
    "statement_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Enrolment_pkey" PRIMARY KEY ("enrolment_id")
);

-- CreateTable
CREATE TABLE "Document" (
    "document_id" TEXT NOT NULL,
    "related_entity" "DocumentRelatedEntity" NOT NULL,
    "related_entity_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storage_key" TEXT,
    "mime_type" TEXT,
    "file_size_bytes" INTEGER,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "audit_id" TEXT NOT NULL,
    "entity_type" "AuditEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" TEXT NOT NULL,
    "role_at_time" "UserRole" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "institution_id" TEXT,
    "change_type" "AuditChangeType" NOT NULL,
    "related_submission_id" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "EvidenceFlag" (
    "flag_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "flagged_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,

    CONSTRAINT "EvidenceFlag_pkey" PRIMARY KEY ("flag_id")
);

-- CreateTable
CREATE TABLE "ReviewComment" (
    "comment_id" TEXT NOT NULL,
    "related_entity" TEXT NOT NULL,
    "related_entity_id" TEXT NOT NULL,
    "comment_by" TEXT NOT NULL,
    "comment_text" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "ReadinessRecommendation" (
    "recommendation_id" TEXT NOT NULL,
    "readiness_id" TEXT NOT NULL,
    "recommended_by" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadinessRecommendation_pkey" PRIMARY KEY ("recommendation_id")
);

-- CreateIndex
CREATE INDEX "Institution_registration_number_idx" ON "Institution"("registration_number");

-- CreateIndex
CREATE INDEX "Institution_province_idx" ON "Institution"("province");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_institution_id_idx" ON "User"("institution_id");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Readiness_institution_id_idx" ON "Readiness"("institution_id");

-- CreateIndex
CREATE INDEX "Readiness_saqa_id_idx" ON "Readiness"("saqa_id");

-- CreateIndex
CREATE INDEX "Readiness_readiness_status_idx" ON "Readiness"("readiness_status");

-- CreateIndex
CREATE UNIQUE INDEX "Learner_user_id_key" ON "Learner"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Learner_national_id_key" ON "Learner"("national_id");

-- CreateIndex
CREATE INDEX "Learner_institution_id_idx" ON "Learner"("institution_id");

-- CreateIndex
CREATE INDEX "Learner_national_id_idx" ON "Learner"("national_id");

-- CreateIndex
CREATE INDEX "Learner_user_id_idx" ON "Learner"("user_id");

-- CreateIndex
CREATE INDEX "Enrolment_institution_id_idx" ON "Enrolment"("institution_id");

-- CreateIndex
CREATE INDEX "Enrolment_learner_id_idx" ON "Enrolment"("learner_id");

-- CreateIndex
CREATE INDEX "Enrolment_enrolment_status_idx" ON "Enrolment"("enrolment_status");

-- CreateIndex
CREATE INDEX "Document_related_entity_related_entity_id_idx" ON "Document"("related_entity", "related_entity_id");

-- CreateIndex
CREATE INDEX "Document_uploaded_by_idx" ON "Document"("uploaded_by");

-- CreateIndex
CREATE INDEX "AuditLog_entity_type_entity_id_idx" ON "AuditLog"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "AuditLog_changed_by_idx" ON "AuditLog"("changed_by");

-- CreateIndex
CREATE INDEX "AuditLog_changed_at_idx" ON "AuditLog"("changed_at");

-- CreateIndex
CREATE INDEX "AuditLog_institution_id_idx" ON "AuditLog"("institution_id");

-- CreateIndex
CREATE INDEX "EvidenceFlag_document_id_idx" ON "EvidenceFlag"("document_id");

-- CreateIndex
CREATE INDEX "EvidenceFlag_flagged_by_idx" ON "EvidenceFlag"("flagged_by");

-- CreateIndex
CREATE INDEX "EvidenceFlag_status_idx" ON "EvidenceFlag"("status");

-- CreateIndex
CREATE INDEX "ReviewComment_related_entity_related_entity_id_idx" ON "ReviewComment"("related_entity", "related_entity_id");

-- CreateIndex
CREATE INDEX "ReviewComment_comment_by_idx" ON "ReviewComment"("comment_by");

-- CreateIndex
CREATE INDEX "ReviewComment_created_at_idx" ON "ReviewComment"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessRecommendation_readiness_id_key" ON "ReadinessRecommendation"("readiness_id");

-- CreateIndex
CREATE INDEX "ReadinessRecommendation_readiness_id_idx" ON "ReadinessRecommendation"("readiness_id");

-- CreateIndex
CREATE INDEX "ReadinessRecommendation_recommended_by_idx" ON "ReadinessRecommendation"("recommended_by");

-- CreateIndex
CREATE INDEX "ReadinessRecommendation_recommendation_idx" ON "ReadinessRecommendation"("recommendation");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Readiness" ADD CONSTRAINT "Readiness_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Learner" ADD CONSTRAINT "Learner_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Learner" ADD CONSTRAINT "Learner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_learner_id_fkey" FOREIGN KEY ("learner_id") REFERENCES "Learner"("learner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "fk_doc_institution" FOREIGN KEY ("related_entity_id") REFERENCES "Institution"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "fk_doc_learner" FOREIGN KEY ("related_entity_id") REFERENCES "Learner"("learner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "fk_doc_readiness" FOREIGN KEY ("related_entity_id") REFERENCES "Readiness"("readiness_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "fk_doc_enrolment" FOREIGN KEY ("related_entity_id") REFERENCES "Enrolment"("enrolment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFlag" ADD CONSTRAINT "EvidenceFlag_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("document_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFlag" ADD CONSTRAINT "EvidenceFlag_flagged_by_fkey" FOREIGN KEY ("flagged_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFlag" ADD CONSTRAINT "EvidenceFlag_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_comment_by_fkey" FOREIGN KEY ("comment_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessRecommendation" ADD CONSTRAINT "ReadinessRecommendation_readiness_id_fkey" FOREIGN KEY ("readiness_id") REFERENCES "Readiness"("readiness_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessRecommendation" ADD CONSTRAINT "ReadinessRecommendation_recommended_by_fkey" FOREIGN KEY ("recommended_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

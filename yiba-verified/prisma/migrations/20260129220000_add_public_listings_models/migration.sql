-- CreateEnum
CREATE TYPE "ContactVisibility" AS ENUM ('HIDDEN', 'REVEAL_ON_CLICK', 'PUBLIC');
CREATE TYPE "ApplyMode" AS ENUM ('INTERNAL', 'EXTERNAL', 'BOTH');
CREATE TYPE "InstitutionPostType" AS ENUM ('ACHIEVEMENT', 'UPDATE');
CREATE TYPE "PostFlagReason" AS ENUM ('MISLEADING', 'FAKE', 'SPAM', 'OTHER');
CREATE TYPE "InstitutionReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'PENDING');
CREATE TYPE "LeadSource" AS ENUM ('PUBLIC', 'STUDENT');
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- AlterTable InstitutionPublicProfile: change contact_visibility and apply_mode to enums
ALTER TABLE "InstitutionPublicProfile" ALTER COLUMN "contact_visibility" TYPE "ContactVisibility" USING (
  CASE
    WHEN "contact_visibility" IS NULL THEN 'HIDDEN'::"ContactVisibility"
    WHEN "contact_visibility"::text IN ('HIDDEN', 'REVEAL_ON_CLICK', 'PUBLIC') THEN "contact_visibility"::text::"ContactVisibility"
    ELSE 'HIDDEN'::"ContactVisibility"
  END
);
ALTER TABLE "InstitutionPublicProfile" ALTER COLUMN "apply_mode" TYPE "ApplyMode" USING (
  CASE
    WHEN "apply_mode" IS NULL THEN 'INTERNAL'::"ApplyMode"
    WHEN "apply_mode"::text IN ('INTERNAL', 'EXTERNAL', 'BOTH') THEN "apply_mode"::text::"ApplyMode"
    ELSE 'INTERNAL'::"ApplyMode"
  END
);

-- CreateTable InstitutionPost
CREATE TABLE "InstitutionPost" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "type" "InstitutionPostType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "video_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable InstitutionPostFlag
CREATE TABLE "InstitutionPostFlag" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" "PostFlagReason" NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionPostFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable InstitutionReview
CREATE TABLE "InstitutionReview" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "user_id" TEXT,
    "reviewer_name" TEXT,
    "reviewer_email" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "InstitutionReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable InstitutionLead
CREATE TABLE "InstitutionLead" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "highest_education_level" TEXT,
    "qualification_interest" TEXT,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstitutionPost_institution_id_idx" ON "InstitutionPost"("institution_id");
CREATE INDEX "InstitutionPost_created_at_idx" ON "InstitutionPost"("created_at");

CREATE UNIQUE INDEX "InstitutionPostFlag_post_id_user_id_key" ON "InstitutionPostFlag"("post_id", "user_id");
CREATE INDEX "InstitutionPostFlag_post_id_idx" ON "InstitutionPostFlag"("post_id");
CREATE INDEX "InstitutionPostFlag_user_id_idx" ON "InstitutionPostFlag"("user_id");

CREATE INDEX "InstitutionReview_institution_id_idx" ON "InstitutionReview"("institution_id");
CREATE INDEX "InstitutionReview_status_idx" ON "InstitutionReview"("status");
CREATE INDEX "InstitutionReview_created_at_idx" ON "InstitutionReview"("created_at");

CREATE INDEX "InstitutionLead_institution_id_idx" ON "InstitutionLead"("institution_id");
CREATE INDEX "InstitutionLead_status_idx" ON "InstitutionLead"("status");
CREATE INDEX "InstitutionLead_created_at_idx" ON "InstitutionLead"("created_at");

-- AddForeignKey
ALTER TABLE "InstitutionPost" ADD CONSTRAINT "InstitutionPost_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InstitutionPostFlag" ADD CONSTRAINT "InstitutionPostFlag_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "InstitutionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstitutionPostFlag" ADD CONSTRAINT "InstitutionPostFlag_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InstitutionReview" ADD CONSTRAINT "InstitutionReview_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstitutionReview" ADD CONSTRAINT "InstitutionReview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InstitutionLead" ADD CONSTRAINT "InstitutionLead_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE CASCADE ON UPDATE CASCADE;

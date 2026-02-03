-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "TalentContactVisibility" AS ENUM ('HIDDEN', 'REVEAL_ON_REQUEST', 'PUBLIC');

-- CreateEnum
CREATE TYPE "JobRequestStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED_SENT', 'EXPIRED', 'REJECTED', 'FLAGGED');

-- CreateTable
CREATE TABLE "PublicTalentProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "headline" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "banner_url" TEXT,
    "primary_location" TEXT,
    "open_to_anywhere" BOOLEAN NOT NULL DEFAULT false,
    "work_type" "WorkType" NOT NULL DEFAULT 'ONSITE',
    "contact_visibility" "TalentContactVisibility" NOT NULL DEFAULT 'REVEAL_ON_REQUEST',
    "public_cv_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicTalentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvVersion" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content_json" JSONB NOT NULL,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CvVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentLike" (
    "id" TEXT NOT NULL,
    "liked_profile_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOpportunityRequest" (
    "id" TEXT NOT NULL,
    "candidate_user_id" TEXT NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_email" TEXT NOT NULL,
    "company_domain" TEXT,
    "company_website" TEXT,
    "role_title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "location" TEXT,
    "work_type" "WorkType",
    "status" "JobRequestStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verification_token" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "publicTalentProfileId" TEXT,

    CONSTRAINT "JobOpportunityRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicTalentProfile_user_id_key" ON "PublicTalentProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PublicTalentProfile_slug_key" ON "PublicTalentProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TalentLike_liked_profile_id_user_id_key" ON "TalentLike"("liked_profile_id", "user_id");

-- AddForeignKey
ALTER TABLE "PublicTalentProfile" ADD CONSTRAINT "PublicTalentProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicTalentProfile" ADD CONSTRAINT "PublicTalentProfile_public_cv_version_id_fkey" FOREIGN KEY ("public_cv_version_id") REFERENCES "CvVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvVersion" ADD CONSTRAINT "CvVersion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentLike" ADD CONSTRAINT "TalentLike_liked_profile_id_fkey" FOREIGN KEY ("liked_profile_id") REFERENCES "PublicTalentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentLike" ADD CONSTRAINT "TalentLike_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpportunityRequest" ADD CONSTRAINT "JobOpportunityRequest_candidate_user_id_fkey" FOREIGN KEY ("candidate_user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpportunityRequest" ADD CONSTRAINT "JobOpportunityRequest_publicTalentProfileId_fkey" FOREIGN KEY ("publicTalentProfileId") REFERENCES "PublicTalentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

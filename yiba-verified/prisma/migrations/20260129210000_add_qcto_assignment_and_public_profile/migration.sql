-- CreateEnum
CREATE TYPE "QctoAssignmentRole" AS ENUM ('REVIEWER', 'AUDITOR');
CREATE TYPE "QctoAssignmentStatus" AS ENUM ('ACTIVE', 'REMOVED', 'COMPLETED');
CREATE TYPE "PublicProfileVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

-- CreateTable
CREATE TABLE "QctoAssignment" (
    "id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "assigned_to_user_id" TEXT NOT NULL,
    "assigned_by_user_id" TEXT NOT NULL,
    "assignment_role" "QctoAssignmentRole" NOT NULL DEFAULT 'REVIEWER',
    "status" "QctoAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QctoAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionPublicProfile" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "tagline" TEXT,
    "about" TEXT,
    "logo_url" TEXT,
    "banner_url" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "contact_visibility" TEXT,
    "apply_mode" TEXT,
    "apply_url" TEXT,
    "featured_until" TIMESTAMP(3),
    "featured_priority" INTEGER NOT NULL DEFAULT 0,
    "verification_status" "PublicProfileVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verified_at" TIMESTAMP(3),
    "verified_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionPublicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QctoAssignment_resource_type_resource_id_assigned_to_user_id_assignment_role_key" ON "QctoAssignment"("resource_type", "resource_id", "assigned_to_user_id", "assignment_role");
CREATE INDEX "QctoAssignment_assigned_to_user_id_idx" ON "QctoAssignment"("assigned_to_user_id");
CREATE INDEX "QctoAssignment_resource_type_resource_id_idx" ON "QctoAssignment"("resource_type", "resource_id");
CREATE INDEX "QctoAssignment_status_idx" ON "QctoAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionPublicProfile_institution_id_key" ON "InstitutionPublicProfile"("institution_id");
CREATE UNIQUE INDEX "InstitutionPublicProfile_slug_key" ON "InstitutionPublicProfile"("slug");
CREATE INDEX "InstitutionPublicProfile_slug_idx" ON "InstitutionPublicProfile"("slug");
CREATE INDEX "InstitutionPublicProfile_is_public_idx" ON "InstitutionPublicProfile"("is_public");

-- AddForeignKey
ALTER TABLE "QctoAssignment" ADD CONSTRAINT "QctoAssignment_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QctoAssignment" ADD CONSTRAINT "QctoAssignment_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionPublicProfile" ADD CONSTRAINT "InstitutionPublicProfile_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill QctoAssignment from ReviewAssignment (only non-CANCELLED; map status)
INSERT INTO "QctoAssignment" (
    "id",
    "resource_type",
    "resource_id",
    "assigned_to_user_id",
    "assigned_by_user_id",
    "assignment_role",
    "status",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    "review_type",
    "review_id",
    "assigned_to",
    "assigned_by",
    "assignment_role"::"QctoAssignmentRole",
    CASE
        WHEN "status" = 'CANCELLED' THEN 'REMOVED'::"QctoAssignmentStatus"
        WHEN "status" = 'COMPLETED' THEN 'COMPLETED'::"QctoAssignmentStatus"
        ELSE 'ACTIVE'::"QctoAssignmentStatus"
    END,
    "assigned_at",
    COALESCE("assigned_at", CURRENT_TIMESTAMP)
FROM "ReviewAssignment"
WHERE "status" != 'CANCELLED'
ON CONFLICT ("resource_type", "resource_id", "assigned_to_user_id", "assignment_role") DO NOTHING;

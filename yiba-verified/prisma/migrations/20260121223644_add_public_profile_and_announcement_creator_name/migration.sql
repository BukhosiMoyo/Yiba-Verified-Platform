-- Add public profile fields to Learner
ALTER TABLE "Learner" ADD COLUMN "public_profile_id" TEXT;
ALTER TABLE "Learner" ADD COLUMN "public_profile_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Learner" ADD COLUMN "public_bio" TEXT;
ALTER TABLE "Learner" ADD COLUMN "public_skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Learner" ADD COLUMN "public_projects" JSONB;

-- Create unique index for public_profile_id
CREATE UNIQUE INDEX "Learner_public_profile_id_key" ON "Learner"("public_profile_id");

-- Create index for public_profile_id lookups
CREATE INDEX "Learner_public_profile_id_idx" ON "Learner"("public_profile_id");

-- Add created_by_name to Announcement (store creator name at creation time for historical accuracy)
ALTER TABLE "Announcement" ADD COLUMN "created_by_name" TEXT NOT NULL DEFAULT '';

-- Update existing announcements with creator names from User table
UPDATE "Announcement" a
SET "created_by_name" = COALESCE(u.first_name || ' ' || u.last_name, 'Unknown User')
FROM "User" u
WHERE a.created_by = u.user_id;

-- Make created_by_name required (after backfilling)
ALTER TABLE "Announcement" ALTER COLUMN "created_by_name" DROP DEFAULT;

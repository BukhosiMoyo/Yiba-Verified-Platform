-- CreateEnum VerificationLevel (for verification badge system)
DO $$ BEGIN
  CREATE TYPE "VerificationLevel" AS ENUM ('NONE', 'BLUE', 'GREEN', 'GOLD', 'BLACK');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable User: add phone verification and verification badge columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone_verified_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone_otp_code" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone_otp_expires" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verification_level" "VerificationLevel" NOT NULL DEFAULT 'NONE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verification_date" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verification_fast_track" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profile_completeness" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "reviews_completed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "violation_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_violation_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

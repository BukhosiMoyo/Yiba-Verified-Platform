-- CreateEnum
CREATE TYPE "UserInstitutionRole" AS ENUM ('ADMIN', 'STAFF');

-- AlterTable Institution: add branch_code (unique) and parent_institution_id (optional FK to head office)
ALTER TABLE "Institution" ADD COLUMN "branch_code" TEXT;
ALTER TABLE "Institution" ADD COLUMN "parent_institution_id" TEXT;

-- CreateIndex (unique on branch_code; multiple NULLs allowed in PostgreSQL)
CREATE UNIQUE INDEX "Institution_branch_code_key" ON "Institution"("branch_code");

-- CreateIndex
CREATE INDEX "Institution_parent_institution_id_idx" ON "Institution"("parent_institution_id");

-- AddForeignKey (self-reference for branches)
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_parent_institution_id_fkey" FOREIGN KEY ("parent_institution_id") REFERENCES "Institution"("institution_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable UserInstitution (many-to-many: user can belong to multiple institutions)
CREATE TABLE "UserInstitution" (
    "user_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "role" "UserInstitutionRole" NOT NULL DEFAULT 'ADMIN',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInstitution_pkey" PRIMARY KEY ("user_id","institution_id")
);

-- CreateIndex
CREATE INDEX "UserInstitution_user_id_idx" ON "UserInstitution"("user_id");

-- CreateIndex
CREATE INDEX "UserInstitution_institution_id_idx" ON "UserInstitution"("institution_id");

-- AddForeignKey
ALTER TABLE "UserInstitution" ADD CONSTRAINT "UserInstitution_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInstitution" ADD CONSTRAINT "UserInstitution_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill UserInstitution from User.institution_id (one row per user with institution, is_primary = true, role = ADMIN)
INSERT INTO "UserInstitution" ("user_id", "institution_id", "role", "is_primary", "created_at")
SELECT "user_id", "institution_id", 'ADMIN'::"UserInstitutionRole", true, CURRENT_TIMESTAMP
FROM "User"
WHERE "institution_id" IS NOT NULL
ON CONFLICT ("user_id", "institution_id") DO NOTHING;

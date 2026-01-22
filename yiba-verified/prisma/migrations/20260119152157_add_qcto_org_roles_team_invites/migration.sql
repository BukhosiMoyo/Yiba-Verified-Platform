-- CreateEnum
CREATE TYPE "QCTOInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'QCTO_SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'QCTO_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'QCTO_REVIEWER';
ALTER TYPE "UserRole" ADD VALUE 'QCTO_AUDITOR';
ALTER TYPE "UserRole" ADD VALUE 'QCTO_VIEWER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "qcto_id" TEXT;

-- CreateTable
CREATE TABLE "QCTOOrg" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'QCTO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QCTOOrg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QCTOInvite" (
    "id" TEXT NOT NULL,
    "qcto_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "QCTOInviteStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "invited_by_user_id" TEXT NOT NULL,

    CONSTRAINT "QCTOInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QCTOInvite_token_hash_key" ON "QCTOInvite"("token_hash");

-- CreateIndex
CREATE INDEX "QCTOInvite_qcto_id_idx" ON "QCTOInvite"("qcto_id");

-- CreateIndex
CREATE INDEX "QCTOInvite_qcto_id_status_idx" ON "QCTOInvite"("qcto_id", "status");

-- CreateIndex
CREATE INDEX "QCTOInvite_email_idx" ON "QCTOInvite"("email");

-- CreateIndex
CREATE INDEX "User_qcto_id_idx" ON "User"("qcto_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_qcto_id_fkey" FOREIGN KEY ("qcto_id") REFERENCES "QCTOOrg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCTOInvite" ADD CONSTRAINT "QCTOInvite_qcto_id_fkey" FOREIGN KEY ("qcto_id") REFERENCES "QCTOOrg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QCTOInvite" ADD CONSTRAINT "QCTOInvite_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

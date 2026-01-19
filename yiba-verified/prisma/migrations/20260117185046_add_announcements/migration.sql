-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Announcement" (
    "announcement_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("announcement_id")
);

-- CreateIndex
CREATE INDEX "Announcement_status_idx" ON "Announcement"("status");

-- CreateIndex
CREATE INDEX "Announcement_created_at_idx" ON "Announcement"("created_at");

-- CreateIndex
CREATE INDEX "Announcement_expires_at_idx" ON "Announcement"("expires_at");

-- CreateIndex
CREATE INDEX "Announcement_created_by_idx" ON "Announcement"("created_by");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('CRITICAL_CREATED', 'PENDING_APPROVAL', 'APPROVED', 'CRITICAL_APPLIED', 'CRITICAL_FAILED', 'CRITICAL_DUE_24H');

-- CreateEnum
CREATE TYPE "EmailEventStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "EmailEvent" (
    "event_id" TEXT NOT NULL,
    "type" "EmailEventType" NOT NULL,
    "change_id" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "body_text" TEXT NOT NULL,
    "status" "EmailEventStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE INDEX "EmailEvent_change_id_idx" ON "EmailEvent"("change_id");

-- CreateIndex
CREATE INDEX "EmailEvent_status_idx" ON "EmailEvent"("status");

-- CreateIndex
CREATE INDEX "EmailEvent_created_at_idx" ON "EmailEvent"("created_at");

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_change_id_fkey" FOREIGN KEY ("change_id") REFERENCES "FeatureChange"("change_id") ON DELETE CASCADE ON UPDATE CASCADE;

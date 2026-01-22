-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE');

-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'ATTENDANCE_RECORD';

-- AlterEnum
ALTER TYPE "DocumentRelatedEntity" ADD VALUE 'ATTENDANCE_RECORD';

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "record_id" TEXT NOT NULL,
    "enrolment_id" TEXT NOT NULL,
    "record_date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "marked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marked_by" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("record_id")
);

-- CreateTable
CREATE TABLE "SickNote" (
    "sick_note_id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SickNote_pkey" PRIMARY KEY ("sick_note_id")
);

-- CreateIndex
CREATE INDEX "AttendanceRecord_enrolment_id_idx" ON "AttendanceRecord"("enrolment_id");

-- CreateIndex
CREATE INDEX "AttendanceRecord_record_date_idx" ON "AttendanceRecord"("record_date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_enrolment_id_record_date_key" ON "AttendanceRecord"("enrolment_id", "record_date");

-- CreateIndex
CREATE UNIQUE INDEX "SickNote_record_id_key" ON "SickNote"("record_id");

-- CreateIndex
CREATE INDEX "SickNote_record_id_idx" ON "SickNote"("record_id");

-- CreateIndex
CREATE UNIQUE INDEX "SickNote_document_id_key" ON "SickNote"("document_id");

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_enrolment_id_fkey" FOREIGN KEY ("enrolment_id") REFERENCES "Enrolment"("enrolment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SickNote" ADD CONSTRAINT "SickNote_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "AttendanceRecord"("record_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SickNote" ADD CONSTRAINT "SickNote_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("document_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('THEORY', 'PRACTICAL', 'WBL', 'ASSESSMENT', 'ORIENTATION', 'OTHER');

-- AlterEnum
ALTER TYPE "SubmissionResourceType" ADD VALUE 'ATTENDANCE_REGISTER';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'FACILITATOR';

-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "minutes_late" INTEGER,
ADD COLUMN     "session_id" TEXT;

-- AlterTable
ALTER TABLE "Enrolment" ADD COLUMN     "cohort_id" TEXT;

-- CreateTable
CREATE TABLE "Cohort" (
    "cohort_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "qualification_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("cohort_id")
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "session_id" TEXT NOT NULL,
    "cohort_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "session_type" "SessionType" NOT NULL DEFAULT 'THEORY',
    "location" TEXT,
    "notes" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_at" TIMESTAMP(3),
    "locked_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "_CohortToFacilitator" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CohortToFacilitator_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Cohort_institution_id_idx" ON "Cohort"("institution_id");

-- CreateIndex
CREATE INDEX "Cohort_qualification_id_idx" ON "Cohort"("qualification_id");

-- CreateIndex
CREATE INDEX "ClassSession_cohort_id_idx" ON "ClassSession"("cohort_id");

-- CreateIndex
CREATE INDEX "ClassSession_date_idx" ON "ClassSession"("date");

-- CreateIndex
CREATE INDEX "_CohortToFacilitator_B_index" ON "_CohortToFacilitator"("B");

-- CreateIndex
CREATE INDEX "AttendanceRecord_session_id_idx" ON "AttendanceRecord"("session_id");

-- CreateIndex
CREATE INDEX "Enrolment_cohort_id_idx" ON "Enrolment"("cohort_id");

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "Cohort"("cohort_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_qualification_id_fkey" FOREIGN KEY ("qualification_id") REFERENCES "Qualification"("qualification_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "Cohort"("cohort_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ClassSession"("session_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CohortToFacilitator" ADD CONSTRAINT "_CohortToFacilitator_A_fkey" FOREIGN KEY ("A") REFERENCES "Cohort"("cohort_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CohortToFacilitator" ADD CONSTRAINT "_CohortToFacilitator_B_fkey" FOREIGN KEY ("B") REFERENCES "Facilitator"("facilitator_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Enrolment" ADD COLUMN     "qualification_id" TEXT;

-- CreateTable
CREATE TABLE "Qualification" (
    "qualification_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("qualification_id")
);

-- CreateIndex
CREATE INDEX "Qualification_code_idx" ON "Qualification"("code");

-- CreateIndex
CREATE INDEX "Enrolment_qualification_id_idx" ON "Enrolment"("qualification_id");

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_qualification_id_fkey" FOREIGN KEY ("qualification_id") REFERENCES "Qualification"("qualification_id") ON DELETE SET NULL ON UPDATE CASCADE;

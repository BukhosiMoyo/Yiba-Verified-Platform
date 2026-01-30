-- AlterTable
ALTER TABLE "Facilitator" ADD COLUMN     "verification_notes" TEXT,
ADD COLUMN     "verification_status" TEXT DEFAULT 'PENDING',
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_by" TEXT;

-- CreateTable
CREATE TABLE "FacilitatorCertification" (
    "certification_id" TEXT NOT NULL,
    "facilitator_id" TEXT NOT NULL,
    "certification_type" TEXT NOT NULL,
    "certification_name" TEXT NOT NULL,
    "issuing_authority" TEXT,
    "certificate_number" TEXT,
    "issue_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "document_id" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilitatorCertification_pkey" PRIMARY KEY ("certification_id")
);

-- CreateIndex
CREATE INDEX "FacilitatorCertification_facilitator_id_idx" ON "FacilitatorCertification"("facilitator_id");

-- CreateIndex
CREATE INDEX "FacilitatorCertification_expiry_date_idx" ON "FacilitatorCertification"("expiry_date");

-- CreateIndex
CREATE INDEX "FacilitatorCertification_certification_type_idx" ON "FacilitatorCertification"("certification_type");

-- CreateIndex
CREATE INDEX "FacilitatorCertification_verified_idx" ON "FacilitatorCertification"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "FacilitatorCertification_document_id_key" ON "FacilitatorCertification"("document_id");

-- CreateIndex
CREATE INDEX "Facilitator_verification_status_idx" ON "Facilitator"("verification_status");

-- CreateIndex
CREATE INDEX "Facilitator_verified_by_idx" ON "Facilitator"("verified_by");

-- AddForeignKey
ALTER TABLE "FacilitatorCertification" ADD CONSTRAINT "FacilitatorCertification_facilitator_id_fkey" FOREIGN KEY ("facilitator_id") REFERENCES "Facilitator"("facilitator_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilitatorCertification" ADD CONSTRAINT "FacilitatorCertification_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("document_id") ON DELETE SET NULL ON UPDATE CASCADE;

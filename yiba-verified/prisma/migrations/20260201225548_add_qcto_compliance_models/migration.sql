-- CreateTable
CREATE TABLE "InstitutionCompliance" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "accreditation_status" TEXT NOT NULL,
    "accreditation_number" TEXT,
    "approval_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "provinces_approved" TEXT[],
    "delivery_modes" TEXT[],
    "last_synced_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionCompliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionQualification" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "qualification_id" TEXT,
    "registry_id" TEXT,
    "approval_status" TEXT NOT NULL DEFAULT 'APPROVED',
    "scope_start_date" TIMESTAMP(3),
    "scope_end_date" TIMESTAMP(3),
    "learner_intake_cap" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionContact" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT,
    "type" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL_ONLY',
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceAuditLog" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "changed_by" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionCompliance_institution_id_key" ON "InstitutionCompliance"("institution_id");

-- CreateIndex
CREATE INDEX "InstitutionCompliance_accreditation_status_idx" ON "InstitutionCompliance"("accreditation_status");

-- CreateIndex
CREATE INDEX "InstitutionCompliance_accreditation_number_idx" ON "InstitutionCompliance"("accreditation_number");

-- CreateIndex
CREATE INDEX "InstitutionQualification_institution_id_idx" ON "InstitutionQualification"("institution_id");

-- CreateIndex
CREATE INDEX "InstitutionQualification_registry_id_idx" ON "InstitutionQualification"("registry_id");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionQualification_institution_id_registry_id_key" ON "InstitutionQualification"("institution_id", "registry_id");

-- CreateIndex
CREATE INDEX "InstitutionContact_email_idx" ON "InstitutionContact"("email");

-- CreateIndex
CREATE INDEX "InstitutionContact_institution_id_idx" ON "InstitutionContact"("institution_id");

-- CreateIndex
CREATE INDEX "InstitutionContact_type_idx" ON "InstitutionContact"("type");

-- CreateIndex
CREATE INDEX "ComplianceAuditLog_institution_id_idx" ON "ComplianceAuditLog"("institution_id");

-- CreateIndex
CREATE INDEX "ComplianceAuditLog_created_at_idx" ON "ComplianceAuditLog"("created_at");

-- AddForeignKey
ALTER TABLE "InstitutionCompliance" ADD CONSTRAINT "InstitutionCompliance_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionQualification" ADD CONSTRAINT "InstitutionQualification_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionQualification" ADD CONSTRAINT "InstitutionQualification_registry_id_fkey" FOREIGN KEY ("registry_id") REFERENCES "QualificationRegistry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionContact" ADD CONSTRAINT "InstitutionContact_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionContact" ADD CONSTRAINT "InstitutionContact_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAuditLog" ADD CONSTRAINT "ComplianceAuditLog_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Assessment" (
    "assessment_id" TEXT NOT NULL,
    "enrolment_id" TEXT NOT NULL,
    "assessment_type" TEXT NOT NULL,
    "assessment_name" TEXT NOT NULL,
    "assessment_date" TIMESTAMP(3) NOT NULL,
    "total_marks" INTEGER,
    "passing_marks" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("assessment_id")
);

-- CreateTable
CREATE TABLE "AssessmentResult" (
    "result_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "module_name" TEXT,
    "marks_obtained" INTEGER,
    "percentage" DECIMAL(5,2),
    "grade" TEXT,
    "passed" BOOLEAN,
    "remarks" TEXT,
    "assessed_by" TEXT,
    "assessed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("result_id")
);

-- CreateTable
CREATE TABLE "ModuleCompletion" (
    "completion_id" TEXT NOT NULL,
    "enrolment_id" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "module_code" TEXT,
    "module_type" TEXT NOT NULL,
    "completion_date" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "final_grade" TEXT,
    "marks_obtained" INTEGER,
    "percentage" DECIMAL(5,2),
    "facilitator_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleCompletion_pkey" PRIMARY KEY ("completion_id")
);

-- CreateIndex
CREATE INDEX "Assessment_enrolment_id_idx" ON "Assessment"("enrolment_id");

-- CreateIndex
CREATE INDEX "Assessment_assessment_date_idx" ON "Assessment"("assessment_date");

-- CreateIndex
CREATE INDEX "Assessment_assessment_type_idx" ON "Assessment"("assessment_type");

-- CreateIndex
CREATE INDEX "AssessmentResult_assessment_id_idx" ON "AssessmentResult"("assessment_id");

-- CreateIndex
CREATE INDEX "AssessmentResult_assessed_by_idx" ON "AssessmentResult"("assessed_by");

-- CreateIndex
CREATE INDEX "AssessmentResult_module_name_idx" ON "AssessmentResult"("module_name");

-- CreateIndex
CREATE INDEX "ModuleCompletion_enrolment_id_idx" ON "ModuleCompletion"("enrolment_id");

-- CreateIndex
CREATE INDEX "ModuleCompletion_facilitator_id_idx" ON "ModuleCompletion"("facilitator_id");

-- CreateIndex
CREATE INDEX "ModuleCompletion_status_idx" ON "ModuleCompletion"("status");

-- CreateIndex
CREATE INDEX "ModuleCompletion_module_type_idx" ON "ModuleCompletion"("module_type");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_enrolment_id_fkey" FOREIGN KEY ("enrolment_id") REFERENCES "Enrolment"("enrolment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("assessment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_assessed_by_fkey" FOREIGN KEY ("assessed_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleCompletion" ADD CONSTRAINT "ModuleCompletion_enrolment_id_fkey" FOREIGN KEY ("enrolment_id") REFERENCES "Enrolment"("enrolment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleCompletion" ADD CONSTRAINT "ModuleCompletion_facilitator_id_fkey" FOREIGN KEY ("facilitator_id") REFERENCES "Facilitator"("facilitator_id") ON DELETE SET NULL ON UPDATE CASCADE;

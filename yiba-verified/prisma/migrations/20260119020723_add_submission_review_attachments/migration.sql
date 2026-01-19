-- CreateTable
CREATE TABLE "SubmissionReviewAttachment" (
    "attachment_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT,
    "file_size_bytes" INTEGER,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionReviewAttachment_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateIndex
CREATE INDEX "SubmissionReviewAttachment_submission_id_idx" ON "SubmissionReviewAttachment"("submission_id");

-- AddForeignKey
ALTER TABLE "SubmissionReviewAttachment" ADD CONSTRAINT "SubmissionReviewAttachment_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "Submission"("submission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionReviewAttachment" ADD CONSTRAINT "SubmissionReviewAttachment_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

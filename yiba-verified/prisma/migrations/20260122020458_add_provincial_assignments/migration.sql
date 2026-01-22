-- Add provincial assignment fields to User model
ALTER TABLE "User" ADD COLUMN "default_province" TEXT;
ALTER TABLE "User" ADD COLUMN "assigned_provinces" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for default_province
CREATE INDEX "User_default_province_idx" ON "User"("default_province");

-- Add updated_at field to QCTOOrg
ALTER TABLE "QCTOOrg" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create ReviewAssignment table
CREATE TABLE "ReviewAssignment" (
    "id" TEXT NOT NULL,
    "review_type" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "assigned_to" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ReviewAssignment_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints for ReviewAssignment
ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_assigned_to_fkey" 
    FOREIGN KEY ("assigned_to") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewAssignment" ADD CONSTRAINT "ReviewAssignment_assigned_by_fkey" 
    FOREIGN KEY ("assigned_by") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for ReviewAssignment
CREATE INDEX "ReviewAssignment_assigned_to_idx" ON "ReviewAssignment"("assigned_to");
CREATE INDEX "ReviewAssignment_review_type_review_id_idx" ON "ReviewAssignment"("review_type", "review_id");
CREATE INDEX "ReviewAssignment_status_idx" ON "ReviewAssignment"("status");

-- Create unique constraint: one assignment per reviewer per review
CREATE UNIQUE INDEX "ReviewAssignment_review_type_review_id_assigned_to_key" 
    ON "ReviewAssignment"("review_type", "review_id", "assigned_to");

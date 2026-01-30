-- Add assignment_role to ReviewAssignment (REVIEWER or AUDITOR; default REVIEWER)
ALTER TABLE "ReviewAssignment" ADD COLUMN "assignment_role" TEXT NOT NULL DEFAULT 'REVIEWER';

-- Drop old unique constraint (one per reviewer per review)
DROP INDEX "ReviewAssignment_review_type_review_id_assigned_to_key";

-- Create new unique constraint: one assignment per (reviewer, role) per review
CREATE UNIQUE INDEX "ReviewAssignment_review_type_review_id_assigned_to_assignment_role_key"
    ON "ReviewAssignment"("review_type", "review_id", "assigned_to", "assignment_role");

-- Index for filtering by assignment role (e.g. "My Assigned Audits")
CREATE INDEX "ReviewAssignment_assignment_role_idx" ON "ReviewAssignment"("assignment_role");

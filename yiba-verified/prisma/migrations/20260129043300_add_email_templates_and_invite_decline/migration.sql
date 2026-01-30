-- RenameIndex (conditional: only if source index exists, so shadow DB replay doesn't fail)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'ReviewAssignment_review_type_review_id_assigned_to_assignment_r'
  ) THEN
    ALTER INDEX "ReviewAssignment_review_type_review_id_assigned_to_assignment_r"
      RENAME TO "ReviewAssignment_review_type_review_id_assigned_to_assignme_key";
  END IF;
END $$;

-- DropIndex (using IF EXISTS to prevent errors in shadow database validation)
DROP INDEX IF EXISTS "AuditLog_entity_type_entity_id_changed_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "AuditLog_institution_id_changed_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Document_related_entity_related_entity_id_status_idx";

-- DropIndex
DROP INDEX IF EXISTS "Document_status_uploaded_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Enrolment_institution_id_deleted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Enrolment_learner_id_deleted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Enrolment_status_created_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Institution_institution_id_deleted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Learner_institution_id_deleted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Learner_national_id_deleted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Notification_user_id_is_read_created_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "QCTORequest_institution_id_deleted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "QCTORequest_institution_id_status_created_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Readiness_institution_id_deleted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Readiness_institution_id_status_created_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Submission_institution_id_deleted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Submission_institution_id_status_created_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "Submission_status_submitted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "User_institution_id_deleted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "User_role_status_idx";

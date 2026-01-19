-- Rollback: Remove feature disabling, Boss Mode, advanced feature flag management
-- Drops: FeatureChange, FeatureChangeApproval, EmailEvent, FeatureFlag, FeatureFlagAudit and related enums

-- 1. Remove FEATURE_CHANGE from AuditEntityType (delete related rows first, then recreate enum)
DELETE FROM "AuditLog" WHERE entity_type = 'FEATURE_CHANGE';

CREATE TYPE "AuditEntityType_new" AS ENUM ('INSTITUTION', 'USER', 'LEARNER', 'ENROLMENT', 'READINESS', 'DOCUMENT');

ALTER TABLE "AuditLog" ALTER COLUMN "entity_type" TYPE "AuditEntityType_new" USING "entity_type"::text::"AuditEntityType_new";

DROP TYPE "AuditEntityType";

ALTER TYPE "AuditEntityType_new" RENAME TO "AuditEntityType";

-- 2. Drop tables (order respects foreign keys)
DROP TABLE IF EXISTS "EmailEvent";
DROP TABLE IF EXISTS "FeatureChangeApproval";
DROP TABLE IF EXISTS "FeatureChange";
DROP TABLE IF EXISTS "FeatureFlagAudit";
DROP TABLE IF EXISTS "FeatureFlag";

-- 3. Drop enums
DROP TYPE IF EXISTS "EmailEventType";
DROP TYPE IF EXISTS "EmailEventStatus";
DROP TYPE IF EXISTS "FeatureChangeApprovalDecision";
DROP TYPE IF EXISTS "FeatureChangeStatus";
DROP TYPE IF EXISTS "FeatureChangeScope";
DROP TYPE IF EXISTS "FeatureFlagAuditStatus";
DROP TYPE IF EXISTS "FeatureFlagAuditAction";
DROP TYPE IF EXISTS "FeatureFlagAuditScope";

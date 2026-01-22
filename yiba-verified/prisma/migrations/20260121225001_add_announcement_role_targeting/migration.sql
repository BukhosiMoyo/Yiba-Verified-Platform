-- Add created_by_role and target_roles to Announcement
ALTER TABLE "Announcement" ADD COLUMN "created_by_role" "UserRole";
ALTER TABLE "Announcement" ADD COLUMN "target_roles" "UserRole"[];

-- Update existing announcements with creator roles from User table
UPDATE "Announcement" a
SET "created_by_role" = COALESCE(u.role, 'PLATFORM_ADMIN'::"UserRole")
FROM "User" u
WHERE a.created_by = u.user_id;

-- Set default for target_roles (empty array = visible to all)
UPDATE "Announcement"
SET "target_roles" = ARRAY[]::"UserRole"[]
WHERE "target_roles" IS NULL;

-- Make fields required after backfilling
ALTER TABLE "Announcement" ALTER COLUMN "created_by_role" SET NOT NULL;
ALTER TABLE "Announcement" ALTER COLUMN "target_roles" SET NOT NULL;
ALTER TABLE "Announcement" ALTER COLUMN "target_roles" SET DEFAULT ARRAY[]::"UserRole"[];

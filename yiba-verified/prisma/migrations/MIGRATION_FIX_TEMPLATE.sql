-- TEMPLATE: Add this to your migration file BEFORE making disability_status NOT NULL
-- 
-- Step 1: Update all existing NULL values to a default value
UPDATE "Learner" 
SET "disability_status" = 'NO' 
WHERE "disability_status" IS NULL;

-- Step 2: Now the column can be made NOT NULL (this will be in the auto-generated migration)
-- The Prisma migration will handle this automatically after we update the NULLs

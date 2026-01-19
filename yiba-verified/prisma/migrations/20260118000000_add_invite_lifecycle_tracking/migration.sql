-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'OPENED', 'ACCEPTED', 'FAILED', 'RETRYING', 'EXPIRED');

-- CreateTable (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS "Invite" (
    "invite_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "institution_id" TEXT,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("invite_id")
);

-- CreateIndex (only if table was just created)
CREATE INDEX IF NOT EXISTS "Invite_email_idx" ON "Invite"("email");
CREATE INDEX IF NOT EXISTS "Invite_institution_id_idx" ON "Invite"("institution_id");
CREATE INDEX IF NOT EXISTS "Invite_expires_at_idx" ON "Invite"("expires_at");
CREATE INDEX IF NOT EXISTS "Invite_token_hash_idx" ON "Invite"("token_hash");
CREATE INDEX IF NOT EXISTS "Invite_created_by_user_id_idx" ON "Invite"("created_by_user_id");

-- AddForeignKey (only if table was just created)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Invite_created_by_user_id_fkey'
    ) THEN
        ALTER TABLE "Invite" ADD CONSTRAINT "Invite_created_by_user_id_fkey" 
            FOREIGN KEY ("created_by_user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Invite_institution_id_fkey'
    ) THEN
        ALTER TABLE "Invite" ADD CONSTRAINT "Invite_institution_id_fkey" 
            FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable (add new columns if they don't exist)
DO $$ 
BEGIN
    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'status') THEN
        ALTER TABLE "Invite" ADD COLUMN "status" "InviteStatus" NOT NULL DEFAULT 'QUEUED';
    END IF;
    
    -- Add attempts column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'attempts') THEN
        ALTER TABLE "Invite" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add max_attempts column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'max_attempts') THEN
        ALTER TABLE "Invite" ADD COLUMN "max_attempts" INTEGER NOT NULL DEFAULT 3;
    END IF;
    
    -- Add last_attempt_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'last_attempt_at') THEN
        ALTER TABLE "Invite" ADD COLUMN "last_attempt_at" TIMESTAMP(3);
    END IF;
    
    -- Add sent_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'sent_at') THEN
        ALTER TABLE "Invite" ADD COLUMN "sent_at" TIMESTAMP(3);
    END IF;
    
    -- Add delivered_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'delivered_at') THEN
        ALTER TABLE "Invite" ADD COLUMN "delivered_at" TIMESTAMP(3);
    END IF;
    
    -- Add opened_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'opened_at') THEN
        ALTER TABLE "Invite" ADD COLUMN "opened_at" TIMESTAMP(3);
    END IF;
    
    -- Add clicked_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'clicked_at') THEN
        ALTER TABLE "Invite" ADD COLUMN "clicked_at" TIMESTAMP(3);
    END IF;
    
    -- Add accepted_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'accepted_at') THEN
        ALTER TABLE "Invite" ADD COLUMN "accepted_at" TIMESTAMP(3);
    END IF;
    
    -- Add failure_reason column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'failure_reason') THEN
        ALTER TABLE "Invite" ADD COLUMN "failure_reason" TEXT;
    END IF;
    
    -- Add retry_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'retry_count') THEN
        ALTER TABLE "Invite" ADD COLUMN "retry_count" INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add next_retry_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'next_retry_at') THEN
        ALTER TABLE "Invite" ADD COLUMN "next_retry_at" TIMESTAMP(3);
    END IF;
    
    -- Add batch_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invite' AND column_name = 'batch_id') THEN
        ALTER TABLE "Invite" ADD COLUMN "batch_id" TEXT;
    END IF;
END $$;

-- CreateIndex (create indexes if they don't exist)
CREATE INDEX IF NOT EXISTS "Invite_status_idx" ON "Invite"("status");
CREATE INDEX IF NOT EXISTS "Invite_batch_id_idx" ON "Invite"("batch_id");
CREATE INDEX IF NOT EXISTS "Invite_next_retry_at_idx" ON "Invite"("next_retry_at");

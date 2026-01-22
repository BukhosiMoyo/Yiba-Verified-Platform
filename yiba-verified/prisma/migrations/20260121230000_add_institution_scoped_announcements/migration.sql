-- Add institution_id to Announcement for institution-scoped announcements
ALTER TABLE "Announcement" ADD COLUMN "institution_id" TEXT;

-- Add foreign key constraint
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_institution_id_fkey" 
  FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for institution_id
CREATE INDEX "Announcement_institution_id_idx" ON "Announcement"("institution_id");

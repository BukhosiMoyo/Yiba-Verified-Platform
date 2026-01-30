-- AlterEnum
ALTER TYPE "DocumentRelatedEntity" ADD VALUE 'USER_FACILITATOR_PROFILE';

-- AlterTable
ALTER TABLE "Facilitator" ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "facilitator_id_number" TEXT,
ADD COLUMN     "facilitator_industry_experience" TEXT,
ADD COLUMN     "facilitator_profile_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "facilitator_qualifications" TEXT;

-- AlterTable
ALTER TABLE "UserInstitution" ADD COLUMN     "can_assess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_facilitate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_moderate" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Facilitator_user_id_idx" ON "Facilitator"("user_id");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "fk_doc_user_facilitator_profile" FOREIGN KEY ("related_entity_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facilitator" ADD CONSTRAINT "Facilitator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

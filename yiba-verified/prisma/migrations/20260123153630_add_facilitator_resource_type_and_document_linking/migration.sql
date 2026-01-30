-- AlterEnum
ALTER TYPE "DocumentRelatedEntity" ADD VALUE 'FACILITATOR';

-- AlterEnum
ALTER TYPE "SubmissionResourceType" ADD VALUE 'FACILITATOR';

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "fk_doc_facilitator" FOREIGN KEY ("related_entity_id") REFERENCES "Facilitator"("facilitator_id") ON DELETE RESTRICT ON UPDATE CASCADE;

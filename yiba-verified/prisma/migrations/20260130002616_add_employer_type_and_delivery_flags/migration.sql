-- AlterEnum
ALTER TYPE "InstitutionType" ADD VALUE 'EMPLOYER';

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "offers_web_based_learning" BOOLEAN,
ADD COLUMN     "offers_workplace_based_learning" BOOLEAN;

-- AlterTable
ALTER TABLE "InstitutionPublicProfile" ALTER COLUMN "contact_visibility" SET DEFAULT 'HIDDEN',
ALTER COLUMN "apply_mode" SET DEFAULT 'INTERNAL';

-- RenameIndex
ALTER INDEX "QctoAssignment_resource_type_resource_id_assigned_to_user_id_as" RENAME TO "QctoAssignment_resource_type_resource_id_assigned_to_user_i_key";

-- RenameIndex
ALTER INDEX "ReviewAssignment_review_type_review_id_assigned_to_assignment_r" RENAME TO "ReviewAssignment_review_type_review_id_assigned_to_assignme_key";

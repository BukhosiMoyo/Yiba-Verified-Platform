-- AlterTable
ALTER TABLE "Readiness" ADD COLUMN     "facilitator_learner_ratio" TEXT,
ADD COLUMN     "number_of_training_rooms" INTEGER,
ADD COLUMN     "ownership_type" TEXT,
ADD COLUMN     "professional_body_registration" BOOLEAN,
ADD COLUMN     "registration_type" TEXT,
ADD COLUMN     "room_capacity" INTEGER,
ADD COLUMN     "self_assessment_completed" BOOLEAN,
ADD COLUMN     "self_assessment_remarks" TEXT,
ADD COLUMN     "training_site_address" TEXT;

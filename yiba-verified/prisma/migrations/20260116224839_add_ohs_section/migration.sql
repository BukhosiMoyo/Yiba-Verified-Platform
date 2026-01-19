-- AlterTable
ALTER TABLE "Readiness" ADD COLUMN     "accessibility_for_disabilities" BOOLEAN,
ADD COLUMN     "emergency_exits_marked" BOOLEAN,
ADD COLUMN     "fire_extinguisher_available" BOOLEAN,
ADD COLUMN     "fire_extinguisher_service_date" TIMESTAMP(3),
ADD COLUMN     "first_aid_kit_available" BOOLEAN,
ADD COLUMN     "ohs_representative_name" TEXT;

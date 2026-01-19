-- AlterTable
ALTER TABLE "Readiness" ADD COLUMN     "backup_frequency" TEXT,
ADD COLUMN     "data_storage_description" TEXT,
ADD COLUMN     "internet_connectivity_method" TEXT,
ADD COLUMN     "isp" TEXT,
ADD COLUMN     "lms_name" TEXT,
ADD COLUMN     "max_learner_capacity" INTEGER,
ADD COLUMN     "security_measures_description" TEXT;

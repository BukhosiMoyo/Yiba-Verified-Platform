-- CreateEnum
CREATE TYPE "ServiceRequestType" AS ENUM ('ACCREDITATION_HELP', 'ACCOUNTING_SERVICES', 'MARKETING_WEBSITES', 'GENERAL_INQUIRY');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SERVICE_REQUEST';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ADVISOR';

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "service_type" "ServiceRequestType" NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'NEW',
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserServiceLead" (
    "user_id" TEXT NOT NULL,
    "service_type" "ServiceRequestType" NOT NULL,

    CONSTRAINT "UserServiceLead_pkey" PRIMARY KEY ("user_id","service_type")
);

-- CreateIndex
CREATE INDEX "ServiceRequest_service_type_idx" ON "ServiceRequest"("service_type");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");

-- CreateIndex
CREATE INDEX "ServiceRequest_assigned_to_idx" ON "ServiceRequest"("assigned_to");

-- CreateIndex
CREATE INDEX "ServiceRequest_created_at_idx" ON "ServiceRequest"("created_at");

-- CreateIndex
CREATE INDEX "UserServiceLead_user_id_idx" ON "UserServiceLead"("user_id");

-- CreateIndex
CREATE INDEX "UserServiceLead_service_type_idx" ON "UserServiceLead"("service_type");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserServiceLead" ADD CONSTRAINT "UserServiceLead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

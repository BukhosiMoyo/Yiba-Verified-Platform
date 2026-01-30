-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('INSTITUTION_ADMIN_INVITE', 'INSTITUTION_STAFF_INVITE', 'STUDENT_INVITE', 'QCTO_INVITE', 'PLATFORM_ADMIN_INVITE', 'SYSTEM_NOTIFICATION', 'AUTH_PASSWORD_RESET', 'AUTH_EMAIL_VERIFY');

-- AlterEnum
ALTER TYPE "InviteStatus" ADD VALUE 'DECLINED';

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "custom_message" TEXT,
ADD COLUMN     "decline_reason" TEXT,
ADD COLUMN     "decline_reason_other" TEXT,
ADD COLUMN     "declined_at" TIMESTAMP(3),
ADD COLUMN     "template_id" TEXT,
ADD COLUMN     "viewed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "type" "EmailTemplateType" NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "header_html" TEXT,
    "body_sections" JSONB,
    "cta_text" TEXT,
    "footer_html" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_type_key" ON "EmailTemplate"("type");

-- CreateIndex
CREATE INDEX "EmailTemplate_type_idx" ON "EmailTemplate"("type");

-- CreateIndex
CREATE INDEX "Invite_template_id_idx" ON "Invite"("template_id");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "campaign_id" TEXT,
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "organization_label" TEXT;

-- CreateTable
CREATE TABLE "InviteCampaign" (
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "audience_type" TEXT NOT NULL,
    "template_id" TEXT,
    "subject" TEXT,
    "send_settings" JSONB,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "opened_count" INTEGER NOT NULL DEFAULT 0,
    "clicked_count" INTEGER NOT NULL DEFAULT 0,
    "accepted_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InviteCampaign_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "InviteEvent" (
    "event_id" TEXT NOT NULL,
    "invite_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteEvent_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE INDEX "InviteCampaign_status_idx" ON "InviteCampaign"("status");

-- CreateIndex
CREATE INDEX "InviteCampaign_created_by_user_id_idx" ON "InviteCampaign"("created_by_user_id");

-- CreateIndex
CREATE INDEX "InviteEvent_invite_id_idx" ON "InviteEvent"("invite_id");

-- CreateIndex
CREATE INDEX "InviteEvent_campaign_id_idx" ON "InviteEvent"("campaign_id");

-- CreateIndex
CREATE INDEX "InviteEvent_type_idx" ON "InviteEvent"("type");

-- CreateIndex
CREATE INDEX "InviteEvent_created_at_idx" ON "InviteEvent"("created_at");

-- CreateIndex
CREATE INDEX "Invite_campaign_id_idx" ON "Invite"("campaign_id");

-- CreateIndex
CREATE INDEX "Invite_domain_idx" ON "Invite"("domain");

-- AddForeignKey
ALTER TABLE "InviteCampaign" ADD CONSTRAINT "InviteCampaign_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCampaign" ADD CONSTRAINT "InviteCampaign_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteEvent" ADD CONSTRAINT "InviteEvent_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "Invite"("invite_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteEvent" ADD CONSTRAINT "InviteEvent_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "InviteCampaign"("campaign_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "InviteCampaign"("campaign_id") ON DELETE SET NULL ON UPDATE CASCADE;

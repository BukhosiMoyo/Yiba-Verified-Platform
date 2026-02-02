import { prisma } from "@/lib/prisma";
import { getEmailService } from "@/lib/email";
import { InviteCampaign, Invite, EmailTemplate } from "@prisma/client";

const BATCH_SIZE_DEFAULT = 25;
const DOMAIN_LIMIT_DEFAULT = 10; // Max emails per domain per run/hour
const GLOBAL_LIMIT_DEFAULT = 100; // Max emails per run

export class CampaignSender {
    /**
     * Process the sending queue
     * This should be called by a cron job (e.g. every minute or 5 minutes)
     */
    static async processQueue() {
        console.log("Starting Campaign Sender...");

        // 1. Find active campaigns (SENDING)
        const activeCampaigns = await prisma.inviteCampaign.findMany({
            where: { status: "SENDING" },
            include: { template: true },
        });

        if (activeCampaigns.length === 0) {
            console.log("No active campaigns.");
            return { sent: 0, errors: 0 };
        }

        let totalSent = 0;
        let totalErrors = 0;

        for (const campaign of activeCampaigns) {
            try {
                const result = await this.processCampaign(campaign);
                totalSent += result.sent;
                totalErrors += result.errors;
            } catch (error) {
                console.error(`Error processing campaign ${campaign.campaign_id}:`, error);
            }
        }

        return { sent: totalSent, errors: totalErrors };
    }

    private static async processCampaign(campaign: InviteCampaign & { template: EmailTemplate | null }) {
        const settings = (campaign.send_settings as any) || {};
        const batchSize = settings.batch_size || BATCH_SIZE_DEFAULT;
        const perDomainLimit = settings.per_domain_limit || DOMAIN_LIMIT_DEFAULT;
        const minDelay = settings.min_delay || 0; // We assume the RUNNER frequency handles delay, or we enforce it here by checking last_sent?
        // "Jitter" and "Delay" are hard to implement in a stateless cron run every minute unless we assume "One Run = One Batch".
        // Let's assume One Run = One Batch per campaign.

        // Check global campaign rate limit (e.g. max per hour)
        // We can check how many sent in last hour.
        if (settings.max_per_hour) {
            const sentLastHour = await prisma.inviteEvent.count({
                where: {
                    campaign_id: campaign.campaign_id,
                    type: "SENT",
                    created_at: { gte: new Date(Date.now() - 3600000) }
                }
            });
            if (sentLastHour >= settings.max_per_hour) {
                console.log(`Campaign ${campaign.name} hit hourly limit (${sentLastHour}/${settings.max_per_hour}).`);
                return { sent: 0, errors: 0 };
            }
        }

        // 2. Fetch queued invites
        // We fetch slightly more than batch size to account for domain filtering
        const candidates = await prisma.invite.findMany({
            where: {
                campaign_id: campaign.campaign_id,
                status: { in: ["QUEUED", "RETRYING"] },
            },
            take: batchSize * 2,
            orderBy: { created_at: "asc" }, // FIFO
        });

        if (candidates.length === 0) {
            // Campaign done?
            // Verify if truly done or just waiting
            const remaining = await prisma.invite.count({
                where: { campaign_id: campaign.campaign_id, status: { in: ["QUEUED", "RETRYING"] } }
            });
            if (remaining === 0) {
                await prisma.inviteCampaign.update({
                    where: { campaign_id: campaign.campaign_id },
                    data: { status: "COMPLETED" }
                });
            }
            return { sent: 0, errors: 0 };
        }

        // 3. Filter by Domain limits (in memory for this batch)
        // We also need to check DB for recent sends to this domain if we want strict enforcement
        const domainCounts: Record<string, number> = {};
        const toSend: Invite[] = [];

        // Pre-check DB for domain limits if strict
        // For MVP/Performance, we might skip detailed DB domain check per item and just enforce it within the Batch + Heuristic
        // But let's do a simple check: don't send to same domain more than X times in this batch.

        for (const invite of candidates) {
            if (toSend.length >= batchSize) break;

            const domain = invite.domain || "unknown";
            if (!domainCounts[domain]) domainCounts[domain] = 0;

            if (domainCounts[domain] < perDomainLimit) {
                toSend.push(invite);
                domainCounts[domain]++;
            }
        }

        // 4. Send Emails
        const emailService = getEmailService();
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        let sentCount = 0;
        let errorCount = 0;

        for (const invite of toSend) {
            try {
                // Construct Content
                // Use custom message OR template
                // If template exists, use it.
                // Variables: {{first_name}}, {{organization}}, {{invite_link}}

                const rawToken = invite.token_raw!;
                if (!rawToken) {
                    throw new Error("Missing raw token for sending");
                }

                // Use Click Tracker: /api/invites/track/click?rid=...&to=...
                // Target is: /invite?token=RAW_TOKEN
                // So link = /api/invites/track/click?rid=ID&to=ENCODED_TARGET
                const targetUrl = `${baseUrl}/invite?token=${rawToken}`;
                const trackingLink = `${baseUrl}/api/invites/track/click?rid=${invite.invite_id}&to=${encodeURIComponent(targetUrl)}`;

                // Open Pixel
                const pixelUrl = `${baseUrl}/api/invites/track/open?rid=${invite.invite_id}`;
                const pixelImg = `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" />`;

                let subject = campaign.subject || "You're invited to Yiba Verified";
                let htmlBody = "";

                if (campaign.template && campaign.template.body_sections) {
                    // Handle template blocks (assuming JSON array of blocks or simple string)
                    // Simplified: if body_sections is string, use it.
                    // If Json, assume { content: string } or similar?
                    // "body_sections Json? // Array of editable blocks or single body HTML"
                    // Let's safe cast or check
                    const sections = campaign.template.body_sections as any;
                    let rawHtml = "";
                    if (typeof sections === "string") rawHtml = sections;
                    else if (typeof sections === 'object' && sections?.html) rawHtml = sections.html;
                    else rawHtml = "<p>You have been invited.</p>"; // Fallback

                    htmlBody = rawHtml;
                    if (campaign.template.subject) subject = campaign.template.subject;
                } else {
                    // Default generic body
                    htmlBody = `
                <p>Hello ${invite.first_name || "there"},</p>
                <p>You have been invited to join ${invite.organization_label || "Yiba Verified"}.</p>
                <p>${invite.custom_message || ""}</p>
                <p><a href="{{invite_link}}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Accept Invite</a></p>
            `;
                }

                // Variable Substitution
                htmlBody = htmlBody
                    .replace(/{{first_name}}/g, invite.first_name || "")
                    .replace(/{{last_name}}/g, invite.last_name || "")
                    .replace(/{{organization}}/g, invite.organization_label || "")
                    .replace(/{{invite_link}}/g, trackingLink);

                // Add Pixel
                if (!htmlBody.includes("track/open")) {
                    htmlBody += pixelImg;
                }

                // Send
                await emailService.send({
                    to: invite.email,
                    subject: subject,
                    html: htmlBody,
                });

                // Update Invite Status
                await prisma.invite.update({
                    where: { invite_id: invite.invite_id },
                    data: {
                        status: "SENT",
                        sent_at: new Date(),
                        attempts: { increment: 1 },
                        last_attempt_at: new Date(),
                    }
                });

                // Log Event
                await prisma.inviteEvent.create({
                    data: {
                        invite_id: invite.invite_id,
                        campaign_id: campaign.campaign_id,
                        type: "SENT",
                    }
                });

                // Update Campaign Stats
                await prisma.inviteCampaign.update({
                    where: { campaign_id: campaign.campaign_id },
                    data: { sent_count: { increment: 1 } }
                });

                sentCount++;

                // Jitter / Delay (Sleep)
                // If we want to space them out within the batch processing (e.g. 1 second) to avoid provider spikes
                if (settings.jitter) {
                    const jitterMs = Math.random() * (settings.jitter * 1000);
                    await new Promise(r => setTimeout(r, jitterMs));
                }

            } catch (err: any) {
                console.error(`Failed to send invite ${invite.invite_id}:`, err);
                errorCount++;

                await prisma.invite.update({
                    where: { invite_id: invite.invite_id },
                    data: {
                        status: "FAILED",
                        failure_reason: err.message || "Unknown error",
                        attempts: { increment: 1 },
                        last_attempt_at: new Date(),
                    }
                });

                await prisma.inviteCampaign.update({
                    where: { campaign_id: campaign.campaign_id },
                    data: { failed_count: { increment: 1 } }
                });
            }
        }

        return { sent: sentCount, errors: errorCount };
    }
}

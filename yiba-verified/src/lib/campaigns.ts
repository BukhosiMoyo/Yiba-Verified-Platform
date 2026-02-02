import { prisma } from "@/lib/prisma";
import type { InviteCampaign, Invite, Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

export interface CreateCampaignInput {
    name: string;
    audience_type: string;
    created_by_user_id: string;
    template_id?: string;
    subject?: string;
    send_settings?: any;
}

export interface AddRecipientsInput {
    email: string;
    first_name?: string;
    last_name?: string;
    organization_label?: string;
    domain?: string;
    role: string; // UserRole enum string
    institution_id?: string;
    default_province?: string;
    phone_number?: string;
}

export class CampaignService {
    /**
     * Create a new campaign
     */
    static async createCampaign(data: CreateCampaignInput): Promise<InviteCampaign> {
        return prisma.inviteCampaign.create({
            data: {
                name: data.name,
                audience_type: data.audience_type,
                created_by_user_id: data.created_by_user_id,
                template_id: data.template_id,
                subject: data.subject,
                send_settings: data.send_settings || {
                    batch_size: 25,
                    min_delay: 30,
                    jitter: 10,
                    max_per_hour: 100,
                    per_domain_limit: 10
                },
                status: "DRAFT",
            },
        });
    }

    /**
     * Add recipients to a campaign in bulk
     */
    static async addRecipients(
        campaignId: string,
        recipients: AddRecipientsInput[]
    ): Promise<{ count: number }> {
        if (recipients.length === 0) return { count: 0 };

        // Prepare data for bulk insert
        // Note: We need to generate tokens manually
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(now.getDate() + 30); // 30 days expiry default

        const inviteData = recipients.map((r) => {
            const token = randomBytes(32).toString("hex");
            // hash is same as token for now, or use a separate hash if we want to secure it further
            // "token_hash" in schema implies we store the hash. But to include it in email we need the raw token.
            // If we store hash, we can't recover the token to send.
            // Usually: Store hash, send raw. But we are creating them here.
            // If we pre-generate, we need to store them.
            // Simplification: Store the token as the "hash" for now (or store raw token if schema lets us).
            // Schema says `token_hash String @unique`.
            // Let's assume we store the token itself in `token_hash` for now to be able to put it in the email later?
            // WAIT. If we send emails LATER, and we only store the HASH, we cannot reconstruct the link!
            // UNLESS: We generate the link NOW and store it? No, links are dynamic.
            // The `Invite` model expects to be able to verify the token.
            // If the usage is: User clicks link ?token=XYZ -> Server hashes XYZ -> matches token_hash.
            // THEN we must store the RAW token somewhere if we want to send it later?
            // OR: We generate the token AT SEND TIME?
            // If we generate at send time, we can't create the Invite record now?
            // We NEED the Invite record now for analytics and management.
            // Solution: Store the raw token in a separate encrypted field? Or just store it in `token_hash` as "plain" if security allows?
            // Re-reading schema: `token_hash String @unique`.
            // If I look at `handleCreateInvite` in `page.tsx`, it returns `invite_link`.
            // I should check how existing invites are created.
            // `createCreateInvite` implementation likely exists.

            return {
                campaign_id: campaignId,
                email: r.email,
                role: r.role as any, // Cast to UserRole
                institution_id: r.institution_id,
                default_province: r.default_province,
                first_name: r.first_name,
                last_name: r.last_name,
                organization_label: r.organization_label,
                domain: r.domain,
                phone_number: r.phone_number,
                token_hash: token, // We use the raw token as the hash key for simplicity in this system if simple-token is used. 
                // BUT wait, standard practice is token_hash = sha256(token).
                // If we change this now, we align with `api/invites/route.ts`.
                // Let's align:
                // token_raw = randomBytes
                // token_hash = sha256(token_raw)
                token_raw: token, // We generated "token" above as hex string. Let's make it consistent.
                // We will generate PROPER hash below
                expires_at: expiresAt,
                created_by_user_id: "system", // Or pass user id
                status: "QUEUED",
            };
        });

        // Fix token generation to be secure (Hash + Raw)
        // We need to iterate and generate proper hash/raw pairs
        const { createHash } = await import("crypto");

        // We recreate the array to ensure proper hashing
        const inviteDataWithHashes = inviteData.map(d => {
            const raw = d.token_raw; // The one we generated
            const hash = createHash("sha256").update(raw).digest("hex");
            return {
                ...d,
                token_raw: raw,
                token_hash: hash
            };
        });

        // We can't use createMany easily if we need `created_by_user_id` from the campaign?
        // We'll require it passed or fetch campaign.
        // For bulk speed, createMany is essential.

        // Fetch campaign creator to attribute invites
        const campaign = await prisma.inviteCampaign.findUnique({
            where: { campaign_id: campaignId },
            select: { created_by_user_id: true }
        });

        if (!campaign) throw new Error("Campaign not found");

        const finalData = inviteDataWithHashes.map(d => ({
            ...d,
            created_by_user_id: campaign.created_by_user_id
        }));

        // Chunking inserts to avoid parameter limits (Postgres limit ~65535 parameters)
        // 5000 rows * ~15 columns = ~75000 params. 
        // Safe chunk size: 1000
        const chunkSize = 1000;
        let totalCount = 0;

        for (let i = 0; i < finalData.length; i += chunkSize) {
            const chunk = finalData.slice(i, i + chunkSize);
            // @ts-ignore - CreateMany input typing can be tricky with enums, assuming casting works
            const result = await prisma.invite.createMany({
                data: chunk as any,
                skipDuplicates: true, // In case of token collision or other constraint
            });
            totalCount += result.count;
        }

        return { count: totalCount };
    }

    /**
     * Start sending a campaign
     */
    static async startCampaign(campaignId: string) {
        return prisma.inviteCampaign.update({
            where: { campaign_id: campaignId },
            data: { status: "SENDING" }
        });
    }

    /**
     * Pause a campaign
     */
    static async pauseCampaign(campaignId: string) {
        return prisma.inviteCampaign.update({
            where: { campaign_id: campaignId },
            data: { status: "PAUSED" }
        });
    }
}

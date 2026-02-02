import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth"; // Assuming standard next-auth
import { authOptions } from "@/lib/auth"; // Assuming auth options location
import { CampaignService } from "@/lib/campaigns";
import { z } from "zod";

// Schema for creating a campaign
const createCampaignSchema = z.object({
    name: z.string().min(1, "Name is required"),
    audience_type: z.string().min(1, "Audience type is required"),
    template_id: z.string().optional(),
    subject: z.string().optional(),
    send_settings: z.object({
        batch_size: z.number().optional(),
        min_delay: z.number().optional(),
        jitter: z.number().optional(),
        max_per_hour: z.number().optional(),
        per_domain_limit: z.number().optional(),
    }).optional(),
});

export async function POST(req: NextRequest) {
    try {
        console.log("Starting Campaign Creation...");
        const session = await getServerSession(authOptions);

        if (!session) {
            console.warn("Campaign Creation Failed: No session found");
            return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
        }

        if (!session.user) {
            console.warn("Campaign Creation Failed: No user in session");
            return NextResponse.json({ error: "Unauthorized - No user" }, { status: 401 });
        }

        console.log(`User attempting creation: ${session.user.email} (Role: ${session.user.role})`);

        if (session.user.role !== "PLATFORM_ADMIN" && session.user.role !== "QCTO_SUPER_ADMIN") {
            console.warn(`Campaign Creation Failed: Invalid role ${session.user.role}`);
            return NextResponse.json({ error: "Unauthorized - Invalid role" }, { status: 401 });
        }

        const body = await req.json();
        console.log("Campaign Payload:", JSON.stringify(body, null, 2));

        const result = createCampaignSchema.safeParse(body);

        if (!result.success) {
            console.warn("Campaign Validation Failed:", JSON.stringify(result.error.flatten(), null, 2));
            return NextResponse.json(
                { error: "Invalid input", details: result.error.flatten() },
                { status: 400 }
            );
        }

        console.log("Validation successful, calling CampaignService.createCampaign...");
        const campaign = await CampaignService.createCampaign({
            ...result.data,
            created_by_user_id: (session.user as any).userId || (session.user as any).id,
        });
        console.log("Campaign created successfully:", campaign);

        return NextResponse.json(campaign, { status: 201 });
    } catch (error: any) {
        console.error("CRITICAL ERROR in Campaign Creation:");
        console.error(error);
        if (error.stack) console.error(error.stack);

        // Check for specific Prisma errors if possible, or just return 500
        return NextResponse.json(
            {
                error: "Failed to create campaign",
                details: error.message || "Unknown error",
                type: error.constructor.name
            },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        // Authorization check...

        const searchParams = req.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");
        const status = searchParams.get("status");

        const where: any = {};
        if (status && status !== "all") {
            where.status = status;
        }

        const [campaigns, total] = await Promise.all([
            prisma.inviteCampaign.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { created_at: "desc" },
                include: {
                    createdBy: {
                        select: { first_name: true, last_name: true, email: true }
                    }
                }
            }),
            prisma.inviteCampaign.count({ where })
        ]);

        return NextResponse.json({ items: campaigns, total });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }
}

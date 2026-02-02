import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CampaignService } from "@/lib/campaigns";
import { z } from "zod";

const updateCampaignSchema = z.object({
    action: z.enum(["START", "PAUSE", "RESUME", "UPDATE"]).optional(),
    name: z.string().optional(),
    template_id: z.string().optional(),
    subject: z.string().optional(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params is a Promise in Next 15+
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user.role !== "PLATFORM_ADMIN" && session.user.role !== "QCTO_SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const campaign = await prisma.inviteCampaign.findUnique({
            where: { campaign_id: id },
            include: {
                createdBy: {
                    select: { first_name: true, last_name: true, email: true }
                },
                template: {
                    select: { name: true }
                }
            }
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // Get funnel stats (real-time count if needed, or rely on denormalized)
        // For now rely on denormalized + recent count if cache is stale? 
        // Just return campaign object which has counts.

        return NextResponse.json(campaign);
    } catch (error) {
        console.error("Get campaign error:", error);
        return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user.role !== "PLATFORM_ADMIN" && session.user.role !== "QCTO_SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const result = updateCampaignSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const { action, ...data } = result.data;

        let updatedCampaign;

        if (action === "START" || action === "RESUME") {
            updatedCampaign = await CampaignService.startCampaign(id);
        } else if (action === "PAUSE") {
            updatedCampaign = await CampaignService.pauseCampaign(id);
        } else {
            // Normal update
            updatedCampaign = await prisma.inviteCampaign.update({
                where: { campaign_id: id },
                data: data
            });
        }

        return NextResponse.json(updatedCampaign);
    } catch (error) {
        console.error("Update campaign error:", error);
        return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
    }
}

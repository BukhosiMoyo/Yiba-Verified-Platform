import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeclineRecord, EngagementState, Role } from "@/lib/outreach/types";

// GET /api/platform-admin/outreach/declines
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const province = searchParams.get("province");
        const reason = searchParams.get("reason");
        const stage = searchParams.get("stage");

        // Build filter
        const where: any = {
            status: "DECLINED"
        };

        if (reason) where.decline_reason = reason;

        // Province is on Institution, so we need to filter via relation or fetch all and filter
        // Prisma supports relation filtering
        if (province) {
            where.institution = {
                province: province
            };
        }

        // Engagement State filtering
        if (stage) {
            where.engagement_state = stage;
        }

        const declines = await prisma.invite.findMany({
            where: where,
            include: {
                institution: true
            },
            orderBy: { declined_at: 'desc' }
        });

        // Map to DeclineRecord
        const records: DeclineRecord[] = declines.map(inv => ({
            decline_id: inv.invite_id,
            institution_id: inv.institution_id || "unknown",
            institution_name: inv.institution?.trading_name || inv.institution?.legal_name || "Unknown",
            reason: (inv.decline_reason as any) || "OTHER",
            message: inv.decline_reason_other || null,
            province: inv.institution?.province || "Unknown",
            stage: inv.engagement_state as EngagementState,
            declined_at: inv.declined_at || inv.updated_at
        }));

        return NextResponse.json(records);

    } catch (error) {
        console.error("Failed to fetch declines:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

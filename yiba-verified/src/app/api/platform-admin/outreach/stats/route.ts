import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EngagementState } from "@/lib/outreach/types";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const province = searchParams.get("province");

        const where: any = {};
        // Filter by province? Usually invites don't have province on them directly without join.
        // But we want counts.

        // Let's assume for now we just want total counts of active invites.
        // Since we import invites with 'UNCONTACTED', counting them gives us the correct breakdown.

        const stats = await prisma.invite.groupBy({
            by: ['engagement_state'],
            _count: {
                invite_id: true
            },
            where: {
                // creating a valid where clause if needed
            }
        });

        const counts: Record<string, number> = {};
        stats.forEach(s => {
            counts[s.engagement_state] = s._count.invite_id;
        });

        return NextResponse.json({ counts });

    } catch (error: any) {
        console.error("[PIPELINE STATS] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/platform-admin/outreach/declines/reasons
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Group by decline_reason
        const groups = await prisma.invite.groupBy({
            by: ['decline_reason'],
            where: {
                status: "DECLINED",
                decline_reason: { not: null }
            },
            _count: {
                decline_reason: true
            }
        });

        const result = groups.map(g => ({
            reason: g.decline_reason,
            count: g._count.decline_reason
        }));

        return NextResponse.json(result);

    } catch (error) {
        console.error("Failed to fetch decline reasons:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

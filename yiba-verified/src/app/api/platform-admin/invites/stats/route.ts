import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || (session.user.role !== "PLATFORM_ADMIN" && session.user.role !== "QCTO_SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch aggregated stats from db
        const [
            totalInvites,
            sentInvites,
            openedInvites,
            clickedInvites,
            acceptedInvites,
            failedInvites,
            dailyStats
        ] = await Promise.all([
            prisma.invite.count(),
            prisma.invite.count({ where: { status: "SENT" } }),
            prisma.invite.count({ where: { opened_at: { not: null } } }),
            prisma.invite.count({ where: { clicked_at: { not: null } } }),
            prisma.invite.count({ where: { status: "ACCEPTED" } }),
            prisma.invite.count({ where: { status: "FAILED" } }),
            // Get daily sent counts for the chart (last 30 days)
            prisma.$queryRaw`
                SELECT DATE(sent_at) as date, COUNT(*) as count 
                FROM "Invite" 
                WHERE sent_at > NOW() - INTERVAL '30 days'
                GROUP BY DATE(sent_at)
                ORDER BY DATE(sent_at) ASC
            `
        ]);

        // Calculate rates
        const openRate = sentInvites > 0 ? Math.round((openedInvites / sentInvites) * 100) : 0;
        const clickRate = openedInvites > 0 ? Math.round((clickedInvites / openedInvites) * 100) : 0;
        const acceptRate = sentInvites > 0 ? Math.round((acceptedInvites / sentInvites) * 100) : 0; // Conversion rate

        return NextResponse.json({
            stats: {
                totalSent: sentInvites,
                openRate,
                clickRate,
                totalAccepted: acceptedInvites,
                conversionRate: acceptRate,
                failedCount: failedInvites
            },
            chartData: dailyStats
        });

    } catch (error) {
        console.error("Stats fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}

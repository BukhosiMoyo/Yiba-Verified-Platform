
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalGenerated, flaggedCount, avgTime] = await Promise.all([
            prisma.invite.count({ where: { created_at: { gte: today } } }),
            prisma.evidenceFlag.count({ where: { created_at: { gte: today } } }),
            // Mock avg time
            Promise.resolve(1200)
        ]);

        const successRate = totalGenerated > 0
            ? ((totalGenerated - flaggedCount) / totalGenerated) * 100
            : 100;

        const interventionRate = totalGenerated > 0
            ? (flaggedCount / totalGenerated) * 100
            : 0;

        return NextResponse.json({
            total_generated_today: totalGenerated,
            success_rate: Math.round(successRate),
            intervention_rate: Math.round(interventionRate),
            avg_generation_time_ms: avgTime
        });

    } catch (error) {
        console.error("Failed to fetch oversight metrics:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

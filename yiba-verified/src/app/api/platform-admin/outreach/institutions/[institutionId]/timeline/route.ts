import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OutreachEvent, OutreachEventType } from "@/lib/outreach/types";

// GET /api/platform-admin/outreach/institutions/[institutionId]/timeline
export async function GET(
    req: Request,
    { params }: { params: Promise<{ institutionId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { institutionId } = await params;

        // Fetch primary invite to get history
        // In future, engagement_history might move to a separate model if it grows too large
        const invite = await prisma.invite.findFirst({
            where: { institution_id: institutionId },
            orderBy: { created_at: 'desc' }
        });

        if (!invite) {
            return NextResponse.json([]);
        }

        const rawHistory = (invite.engagement_history as any[]) || [];

        // Map Raw History (EngagementHistoryEntry) to OutreachEvent format for UI
        // UI expects: event_id, event_type, timestamp, metadata, triggered_by...
        const events: OutreachEvent[] = rawHistory.map((entry: any, index: number) => ({
            event_id: `evt_${index}_${entry.timestamp}`,
            institution_id: institutionId,
            event_type: entry.event as OutreachEventType, // Cast or map if needed
            timestamp: entry.timestamp,
            metadata: entry.metadata || {},
            triggered_by: entry.triggered_by || 'SYSTEM', // Default if missing
            description: entry.description
        })).reverse(); // Newest first

        return NextResponse.json(events);

    } catch (error) {
        console.error("Failed to fetch timeline:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

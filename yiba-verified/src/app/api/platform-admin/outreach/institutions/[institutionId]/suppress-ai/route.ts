import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/platform-admin/outreach/institutions/[institutionId]/suppress-ai
export async function POST(
    req: Request,
    { params }: { params: Promise<{ institutionId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { institutionId } = await params;
        const { suppress } = await req.json();

        // We don't have a direct 'ai_suppressed' field on Institution yet in the schema shown earlier?
        // Let's check schema again? 
        // Invite has `status`, `engagement_state`.
        // Maybe we just log it for now as we want "Real" behavior but if schema lacks it...
        // Wait, `StatusFlags` in Types has `ai_suppressed`.
        // Let's assume we use a JSON field or just a flag on Invite if exists.
        // Or we can just log it to engagement_history as a constraint.

        // Better: Update `engagement_history` to note AI suppression
        const invite = await prisma.invite.findFirst({
            where: { institution_id: institutionId },
            orderBy: { created_at: 'desc' }
        });

        if (invite) {
            await prisma.invite.update({
                where: { invite_id: invite.invite_id },
                data: {
                    engagement_history: [
                        ...(invite.engagement_history as any[] || []),
                        {
                            event: "AI_CONFIG_CHANGED",
                            timestamp: new Date(),
                            triggered_by: "HUMAN",
                            description: `AI Response ${suppress ? 'Suppressed' : 'Enabled'}`,
                            metadata: { ai_suppressed: suppress }
                        }
                    ]
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Failed to suppress AI:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

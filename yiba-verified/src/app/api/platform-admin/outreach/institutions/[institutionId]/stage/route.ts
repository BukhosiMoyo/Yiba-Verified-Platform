import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/platform-admin/outreach/institutions/[institutionId]/stage
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
        const { stage } = await req.json();

        // Update filtered invite (primary) or all?
        // Usually stage is per institution, but we store it on Invite.
        // Let's update all invites for this institution for now, or just the primary one.
        // Simpler: Update ALL invites for this institution to the new stage ??
        // No, maybe just the latest one.
        // Let's Find the latest invite.
        const invite = await prisma.invite.findFirst({
            where: { institution_id: institutionId },
            orderBy: { created_at: 'desc' }
        });

        if (!invite) {
            return NextResponse.json({ error: "No invite found" }, { status: 404 });
        }

        await prisma.invite.update({
            where: { invite_id: invite.invite_id },
            data: {
                engagement_state: stage,
                // Add to history
                engagement_history: [
                    ...(invite.engagement_history as any[] || []),
                    {
                        event: "STAGE_CHANGED",
                        timestamp: new Date(),
                        triggered_by: "HUMAN",
                        description: `Stage changed to ${stage} by admin`,
                        metadata: { from: invite.engagement_state, to: stage }
                    }
                ]
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Failed to update stage:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

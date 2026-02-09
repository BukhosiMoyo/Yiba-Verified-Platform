import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EngagementState } from "@/lib/outreach/types";

export async function POST(
    req: Request,
    context: { params: Promise<{ inviteId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { inviteId } = await context.params;
        const body = await req.json();
        const { stage } = body;

        if (!stage || !Object.values(EngagementState).includes(stage as EngagementState)) {
            return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
        }

        const updatedInvite = await prisma.invite.update({
            where: { invite_id: inviteId },
            data: {
                engagement_state: stage as EngagementState,
                last_interaction_at: new Date(),
                // Should we log history? Ideally yes, but out of scope for "Refactor Pipeline UI".
            }
        });

        return NextResponse.json(updatedInvite);
    } catch (error) {
        console.error("[INVITE STAGE UPDATE] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

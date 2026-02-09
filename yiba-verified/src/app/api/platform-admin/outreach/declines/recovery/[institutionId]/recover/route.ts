import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    context: { params: Promise<{ institutionId: string }> }
) {
    const { institutionId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { strategy } = body;

    try {
        // Find the declined invite for this institution
        const invite = await prisma.invite.findFirst({
            where: {
                institution_id: institutionId,
                status: "DECLINED"
            },
            orderBy: { declined_at: 'desc' }
        });

        if (!invite) {
            return NextResponse.json({ error: "No declined invite found" }, { status: 404 });
        }

        // Reset to QUEUED to retry
        await prisma.invite.update({
            where: { invite_id: invite.invite_id },
            data: {
                status: "QUEUED",
                attempts: 0,
                next_retry_at: new Date(), // Retry immediately
                custom_message: `Recovery strategy: ${strategy}`, // Log strategy in message or separate log
                updated_at: new Date(),
                // Clear decline info so it doesn't show up in decline list anymore
                decline_reason: null,
                declined_at: null
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to recover candidate:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

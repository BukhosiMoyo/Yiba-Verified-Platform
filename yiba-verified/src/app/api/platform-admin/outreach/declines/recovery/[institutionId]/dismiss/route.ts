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

    try {
        // Find the declined invite
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

        // Set to EXPIRED to indicate we are moving on
        await prisma.invite.update({
            where: { invite_id: invite.invite_id },
            data: {
                status: "EXPIRED",
                updated_at: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to dismiss candidate:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    context: { params: Promise<{ flagId: string }> }
) {
    const { flagId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { action, feedback } = body;

    try {
        await prisma.evidenceFlag.update({
            where: { flag_id: flagId },
            data: {
                status: "RESOLVED",
                resolved_by: session.user.userId,
                resolved_at: new Date(),
                // Store feedback/action in reason or create a separate log if needed. 
                // For now, we append to reason or notes if schema supported it. 
                // Since we don't have a notes field on EvidenceFlag, we'll just resolve it.
            }
        });

        // In a real system, we'd use 'feedback' to retrain the model or update AIPolicy.
        if (feedback) {
            console.log("AI Feedback received:", feedback);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Failed to review flag:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

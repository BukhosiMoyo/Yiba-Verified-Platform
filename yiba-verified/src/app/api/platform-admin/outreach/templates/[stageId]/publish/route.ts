import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EngagementState } from "@prisma/client";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ stageId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { stageId } = await params;

    try {
        // Validate stage
        if (!Object.values(EngagementState).includes(stageId as EngagementState)) {
            return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
        }

        const template = await prisma.engagementStageTemplate.update({
            where: { stage: stageId as EngagementState },
            data: {
                status: "PUBLISHED",
                published_at: new Date()
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Error publishing template:", error);
        return NextResponse.json({ error: "Failed to publish template" }, { status: 500 });
    }
}

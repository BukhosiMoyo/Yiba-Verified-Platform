import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EngagementState } from "@prisma/client";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ stageId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { stageId } = await params; // Enum string like UNCONTACTED

    try {
        const body = await req.json();

        // Validate stage
        if (!Object.values(EngagementState).includes(stageId as EngagementState)) {
            return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
        }

        const template = await prisma.engagementStageTemplate.update({
            where: { stage: stageId as EngagementState },
            data: {
                subject_line: body.subject_line,
                preview_text: body.preview_text,
                body_html: body.body_html,
                cta_url: body.cta_url,
                ai_instructions: body.ai_instructions,
                eligibility_rules: body.eligibility_rules,
                // Increment version on save? Or only publish?
                // Let's increment generic version on save for audit
                version: { increment: 1 },
                status: "DRAFT" // Resets to draft on edit
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Error updating template:", error);
        return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }
}

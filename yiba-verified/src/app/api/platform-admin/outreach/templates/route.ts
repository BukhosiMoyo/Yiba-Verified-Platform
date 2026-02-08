import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const templates = await prisma.engagementStageTemplate.findMany({
            orderBy: {
                stage: 'asc'
            }
        });

        return NextResponse.json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        // Allow creating/updating template
        const template = await prisma.engagementStageTemplate.upsert({
            where: { stage: body.stage },
            create: {
                ...body,
                created_by: session.user.email
            },
            update: {
                ...body,
                version: { increment: 1 }
            }
        });

        return NextResponse.json(template);
    } catch (error) {
        console.error("Error saving template:", error);
        return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
    }
}

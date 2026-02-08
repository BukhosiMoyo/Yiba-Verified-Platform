
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";

export async function GET(req: NextRequest) {
    try {
        await requireAuth(req); // Ensure user is admin

        const questionnaires = await prisma.questionnaire.findMany({
            include: {
                _count: {
                    select: { responses: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Add proper typing later if needed, for now return raw data plus counts
        return NextResponse.json(questionnaires);
    } catch (error) {
        console.error("Error fetching questionnaires:", error);
        return NextResponse.json({ error: "Failed to fetch questionnaires" }, { status: 500 });
    }
}

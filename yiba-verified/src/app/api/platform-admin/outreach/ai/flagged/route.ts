
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FlaggedContent } from "@/lib/outreach/types";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch active evidence flags
        const flags = await prisma.evidenceFlag.findMany({
            where: { status: "ACTIVE" },
            include: { document: true },
            orderBy: { created_at: 'desc' }
        });

        const flaggedContent: FlaggedContent[] = flags.map(flag => ({
            flag_id: flag.flag_id,
            violation_type: flag.reason,
            content_snippet: flag.document?.file_name || "Unknown Document",
            // Mock confidence score
            confidence_score: 0.85 + (Math.random() * 0.1)
        }));

        return NextResponse.json(flaggedContent);

    } catch (error) {
        console.error("Failed to fetch flagged content:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

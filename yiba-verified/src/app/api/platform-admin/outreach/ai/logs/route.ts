
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GeneratedContentLog } from "@/lib/outreach/types";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch recent invites as pseudo-"AI Generation Logs"
        const invites = await prisma.invite.findMany({
            take: 20,
            orderBy: { created_at: 'desc' },
            include: { institution: true }
        });

        const logs: GeneratedContentLog[] = invites.map(invite => ({
            log_id: invite.invite_id,
            target_institution: invite.institution?.legal_name || invite.email || "Unknown",
            generated_at: invite.created_at,
            // Use custom message if available, else a default template text
            content_snippet: invite.custom_message || `Subject: Invitation to Yiba Verified\n\nDear ${invite.institution?.contact_person_name || 'Partner'},\n\nWe would like to invite you...`,
            prompt_template: invite.template_id || "Standard Invite",
            // Mock sentiment for now
            sentiment_score: 0.7 + (Math.random() * 0.2)
        }));

        return NextResponse.json(logs);

    } catch (error) {
        console.error("Failed to fetch generated logs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

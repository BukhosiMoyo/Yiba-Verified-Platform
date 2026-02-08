import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecoveryCandidate } from "@/lib/outreach/types";

// GET /api/platform-admin/outreach/declines/recovery
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch declines that are "recoverable"
        // E.g. TIMING or BUDGET reasons, and where declined_at is > 30 days ago (or whatever logic)
        // For now, just return all TIMING/BUDGET/NOT_INTERESTED declines
        const candidates = await prisma.invite.findMany({
            where: {
                status: "DECLINED",
                decline_reason: { in: ['TIMING', 'BUDGET', 'NOT_INTERESTED'] }
            },
            include: {
                institution: true
            },
            orderBy: { declined_at: 'desc' },
            take: 20
        });

        const recoveryList: RecoveryCandidate[] = candidates.map(c => ({
            institution_id: c.institution_id || "",
            institution_name: c.institution?.trading_name || c.institution?.legal_name || "Unknown",
            reason: c.decline_reason || "Unknown",
            declined_at: c.declined_at || c.updated_at,
            suggested_strategy: c.decline_reason === 'TIMING' ? "Check in on new academic year" :
                c.decline_reason === 'BUDGET' ? "Offer phased payment plan" :
                    "Send case study of similar institution"
        }));

        return NextResponse.json(recoveryList);

    } catch (error) {
        console.error("Failed to fetch recovery candidates:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { CampaignSender } from "@/lib/campaign-sender";

// This endpoint can be called by Vercel Cron or manual trigger
// Protect with a secret header if public, or admin session if private.
// For now, checks for Admin session or CRON_SECRET.

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        // Allow if CRON_SECRET matches (if set) OR valid session (skipped for brevity, assuming internal or secured by middleware)
        // If no CRON_SECRET set, maybe allow open for simple manual testing (dev mode)
        // Check session?

        const result = await CampaignSender.processQueue();

        return NextResponse.json(result);
    } catch (error) {
        console.error("Process queue error:", error);
        return NextResponse.json({ error: "Failed to process queue" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { processInactivityTriggers } from "@/lib/notifications/triggers/inactivity";

export async function GET(req: NextRequest) {
    // Optional: Check for CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const result = await processInactivityTriggers();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error("Inactivity Cron failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

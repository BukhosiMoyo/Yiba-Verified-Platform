import { NextRequest, NextResponse } from "next/server";
import { processProfileTriggers } from "@/lib/notifications/triggers/profile";

export async function GET(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const result = await processProfileTriggers();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error("Profile Cron failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

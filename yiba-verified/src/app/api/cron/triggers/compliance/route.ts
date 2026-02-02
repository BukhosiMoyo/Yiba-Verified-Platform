import { NextRequest, NextResponse } from "next/server";
import { processComplianceTriggers } from "@/lib/notifications/triggers/compliance";

export async function GET(req: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const result = await processComplianceTriggers();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error("Compliance Cron failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

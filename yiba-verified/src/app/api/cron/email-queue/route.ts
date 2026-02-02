import { NextRequest, NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/notifications/email-worker";

// Vercel Cron expects a GET request usually, but we can secure it with a secret if needed.
// For now, making it public or protected by a simple header check if configured.

export async function GET(req: NextRequest) {
    // Optional: Check for CRON_SECRET if environment variable is set
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const result = await processEmailQueue();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error("Cron failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

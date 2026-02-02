import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPreferences, updatePreference } from "@/lib/notifications/preferences";
import { NotificationCategory } from "@/lib/notifications/types";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const preferences = await getUserPreferences(session.user.userId);
        return NextResponse.json({ items: preferences });
    } catch (error) {
        console.error("Failed to fetch preferences:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { category, email_enabled, in_app_enabled, sms_enabled } = body;

        // Validate category
        if (!category) {
            return NextResponse.json({ error: "Category is required" }, { status: 400 });
        }

        const updated = await updatePreference(
            session.user.userId,
            category as NotificationCategory,
            {
                email: email_enabled,
                in_app: in_app_enabled,
                sms: sms_enabled
            }
        );

        return NextResponse.json({ success: true, item: updated });
    } catch (error) {
        console.error("Failed to update preferences:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

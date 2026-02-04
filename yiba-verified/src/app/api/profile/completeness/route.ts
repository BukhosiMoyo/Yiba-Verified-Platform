import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { calculateUserCompleteness } from "@/lib/completeness";

export async function GET(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        const user = await prisma.user.findUnique({
            where: { user_id: ctx.userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const completeness = calculateUserCompleteness(user);

        // Optimize: Update user profile_completeness if different
        if (user.profile_completeness !== completeness.percentage) {
            // Fire and forget update
            await prisma.user.update({
                where: { user_id: ctx.userId },
                data: { profile_completeness: completeness.percentage },
            });
        }

        return NextResponse.json(completeness);
    } catch (error) {
        console.error("Completeness API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

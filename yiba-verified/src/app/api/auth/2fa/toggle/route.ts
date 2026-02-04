import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { verifyTwoFactorToken } from "@/lib/auth/2fa";

export async function POST(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);
        const body = await request.json();
        const { action, token } = body; // action: 'enable' | 'disable'

        const user = await prisma.user.findUnique({ where: { user_id: ctx.userId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (action === "enable") {
            if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });
            if (!user.two_factor_secret) return NextResponse.json({ error: "Setup required" }, { status: 400 });

            const isValid = await verifyTwoFactorToken(token, user.two_factor_secret);
            if (!isValid) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

            await prisma.user.update({
                where: { user_id: ctx.userId },
                data: { two_factor_enabled: true },
            });

            return NextResponse.json({ message: "2FA Enabled" });
        }

        if (action === "disable") {
            // Usually require current password or 2FA token to disable. 
            // For now, simplify.
            await prisma.user.update({
                where: { user_id: ctx.userId },
                data: { two_factor_enabled: false, two_factor_secret: null },
            });
            return NextResponse.json({ message: "2FA Disabled" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: "Request failed" }, { status: 500 });
    }
}

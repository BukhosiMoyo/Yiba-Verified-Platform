import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { generateTwoFactorSecret, generateQRCode } from "@/lib/auth/2fa";

export async function POST(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);
        const user = await prisma.user.findUnique({ where: { user_id: ctx.userId } });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { secret, otpauth } = generateTwoFactorSecret(user.email);
        const qrCode = await generateQRCode(otpauth);

        // Do NOT save secret yet, only return it. Save it when verified and enabled.
        // Actually, we usually save it tentatively or client sends it back to verify.
        // Better: Save it to DB in a temp field or just overwrite `two_factor_secret` but keep `two_factor_enabled` false until verified.

        await prisma.user.update({
            where: { user_id: ctx.userId },
            data: { two_factor_secret: secret },
        });

        return NextResponse.json({ secret, qrCode });
    } catch (error) {
        return NextResponse.json({ error: "Failed to generate 2FA" }, { status: 500 });
    }
}

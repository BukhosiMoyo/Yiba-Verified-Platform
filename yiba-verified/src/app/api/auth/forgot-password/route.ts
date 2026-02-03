
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmailService } from "@/lib/email";
import { EmailType } from "@/lib/email/types";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        // 1. Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Security: Always return success even if user not found to prevent enumeration
        if (!user) {
            // Fake delay to match processing time
            await new Promise((resolve) => setTimeout(resolve, 500));
            return NextResponse.json({ message: "If an account exists, a reset link has been sent." }, { status: 200 });
        }

        // 2. Generate token
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600000); // 1 hour

        // 3. Store token
        await prisma.verificationToken.create({
            data: {
                identifier: email.toLowerCase(),
                token,
                expires,
            },
        });

        // 4. Send Email
        const emailService = getEmailService();
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
        const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

        const { getSharedEmailLayout } = require("@/lib/email/layout");

        // Use user's first name if available, otherwise generic
        const firstName = user.name ? user.name.split(" ")[0] : "there";

        const contentHtml = `
            <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 24px;">Reset your Yiba Verified password</h1>
            
            <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">We received a request to reset the password for your Yiba Verified account.</p>
            
            <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">Click the button below to choose a new password. For security reasons, this link will expire in 60 minutes.</p>
            
            <div style="margin: 32px 0; text-align: center;">
              <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
            </div>
            
            <p style="color: #4b5563; font-size: 16px; margin: 20px 0; line-height: 1.6;">If you didn’t request a password reset, you can safely ignore this email — your account will remain secure.</p>
            
            <p style="color: #9ca3af; font-size: 14px; margin-top: 24px; text-align: center;">
              For your protection, we’ll never ask for your password via email.
            </p>
        `;

        const html = getSharedEmailLayout({
            contentHtml,
            title: "Reset your Yiba Verified password",
            previewText: "This link will expire for security reasons.",
        });

        await emailService.send({
            to: email,
            type: EmailType.PASSWORD_RESET,
            subject: "Reset your Yiba Verified password",
            html,
            text: `Reset your password: ${resetUrl}`,
        });

        return NextResponse.json({ message: "Reset link sent" }, { status: 200 });

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

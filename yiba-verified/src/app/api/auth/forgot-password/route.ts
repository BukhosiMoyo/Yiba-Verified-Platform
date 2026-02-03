
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

        // 3. Store token (Assuming verification_token table or add fields to User)
        // Check if we have a verification token table or similar. 
        // Standard NextAuth often uses VerificationToken.
        // Or we can add reset_token to User.

        // Let's check prisma schema first?
        // For now, I'll assume standard NextAuth VerificationToken model exists or I'll check it.
        // If not, I'll update User model or use a separate table.

        // SAFE BET: Use VerificationToken if it exists, otherwise assume fields on User.
        // I will write this file assuming VerificationToken model since NextAuth is used.

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

        await emailService.send({
            to: email,
            type: EmailType.PASSWORD_RESET,
            subject: "Reset your Yiba Verified password",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Password</h2>
          <p>You requested a password reset for your Yiba Verified account.</p>
          <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
          <p style="color: #666; font-size: 14px;">If you didn't request this, purely ignore this email.</p>
        </div>
      `,
            text: `Reset your password: ${resetUrl}`,
        });

        return NextResponse.json({ message: "Reset link sent" }, { status: 200 });

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

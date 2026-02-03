import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { getEmailService } from "@/lib/email";
import { EmailType } from "@/lib/email/types";
import {
  generateVerifyNewEmailHtml,
  generateVerifyNewEmailText,
} from "@/lib/email/emailChangeTemplates";

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { user_id: session.user.userId },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find pending request
    const pendingRequest = await prisma.emailChangeRequest.findFirst({
      where: {
        user_id: session.user.userId,
        status: "PENDING",
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
    });

    if (!pendingRequest) {
      return NextResponse.json(
        { error: "No pending email change request found" },
        { status: 404 }
      );
    }

    // Check cooldown (prevent spam)
    const timeSinceCreated = Date.now() - pendingRequest.created_at.getTime();
    if (timeSinceCreated < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceCreated) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSeconds} seconds before resending` },
        { status: 429 }
      );
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await hash(token, 10);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    // Update request with new token
    await prisma.emailChangeRequest.update({
      where: { id: pendingRequest.id },
      data: {
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_at: new Date(), // Reset created_at for cooldown tracking
      },
    });

    // Send verification email
    const emailService = getEmailService();
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/api/account/email/verify?token=${token}`;
    const userName = `${user.first_name} ${user.last_name}`;

    await emailService.send({
      to: pendingRequest.new_email,
      type: EmailType.VERIFICATION,
      subject: "Verify your new email address - Yiba Verified",
      html: generateVerifyNewEmailHtml({
        userName,
        newEmail: pendingRequest.new_email,
        verificationUrl,
        expiresIn: "24 hours",
      }),
      text: generateVerifyNewEmailText({
        userName,
        newEmail: pendingRequest.new_email,
        verificationUrl,
        expiresIn: "24 hours",
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Verification email resent",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Resend email change error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}

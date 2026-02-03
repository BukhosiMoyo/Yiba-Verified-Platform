import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import crypto from "crypto";
import { getEmailService } from "@/lib/email";
import { EmailType } from "@/lib/email/types";
import {
  generateVerifyNewEmailHtml,
  generateVerifyNewEmailText,
  generateNotifyOldEmailHtml,
  generateNotifyOldEmailText,
  maskEmail,
} from "@/lib/email/emailChangeTemplates";

// Rate limit: 3 requests per 24 hours
const RATE_LIMIT_COUNT = 3;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { newEmail, currentPassword } = body;

    // Validate input
    if (!newEmail || !currentPassword) {
      return NextResponse.json(
        { error: "New email and current password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { user_id: session.user.userId },
      select: {
        user_id: true,
        email: true,
        password_hash: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if new email is same as current
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "New email must be different from current email" },
        { status: 400 }
      );
    }

    // Check if new email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 409 }
      );
    }

    // Verify password
    if (!user.password_hash) {
      return NextResponse.json(
        { error: "Cannot change email for accounts without password" },
        { status: 400 }
      );
    }

    const passwordValid = await compare(currentPassword, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    // Check rate limit
    const recentRequests = await prisma.emailChangeRequest.count({
      where: {
        user_id: user.user_id,
        created_at: {
          gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS),
        },
      },
    });

    if (recentRequests >= RATE_LIMIT_COUNT) {
      return NextResponse.json(
        { error: "Too many email change requests. Please try again later." },
        { status: 429 }
      );
    }

    // Check for existing pending request
    const pendingRequest = await prisma.emailChangeRequest.findFirst({
      where: {
        user_id: user.user_id,
        status: "PENDING",
        expires_at: { gt: new Date() },
      },
    });

    if (pendingRequest) {
      return NextResponse.json(
        { error: "You already have a pending email change request. Please complete or cancel it first." },
        { status: 409 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await hash(token, 10);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    // Get request metadata
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "Unknown";
    const userAgent = request.headers.get("user-agent") || "Unknown";

    // Create email change request
    await prisma.emailChangeRequest.create({
      data: {
        user_id: user.user_id,
        current_email: user.email,
        new_email: newEmail.toLowerCase(),
        token_hash: tokenHash,
        expires_at: expiresAt,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        user_id: user.user_id,
        activity_type: "EMAIL_CHANGE_REQUESTED",
        ip_address: ipAddress,
        user_agent: userAgent,
        success: true,
      },
    });

    // Send emails
    const emailService = getEmailService();
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/api/account/email/verify?token=${token}`;
    const userName = `${user.first_name} ${user.last_name}`;
    const requestedAt = new Date().toLocaleString("en-ZA", {
      dateStyle: "full",
      timeStyle: "short",
    });

    // Send verification email to new address
    await emailService.send({
      to: newEmail,
      type: EmailType.VERIFICATION,
      subject: "Verify your new email address - Yiba Verified",
      html: generateVerifyNewEmailHtml({
        userName,
        newEmail,
        verificationUrl,
        expiresIn: "24 hours",
      }),
      text: generateVerifyNewEmailText({
        userName,
        newEmail,
        verificationUrl,
        expiresIn: "24 hours",
      }),
    });

    // Send notification to old address
    await emailService.send({
      to: user.email,
      type: EmailType.SYSTEM_ALERT,
      subject: "⚠️ Email change requested for your Yiba Verified account",
      html: generateNotifyOldEmailHtml({
        userName,
        currentEmail: user.email,
        newEmailMasked: maskEmail(newEmail),
        requestedAt,
        ipAddress,
      }),
      text: generateNotifyOldEmailText({
        userName,
        currentEmail: user.email,
        newEmailMasked: maskEmail(newEmail),
        requestedAt,
        ipAddress,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent to your new address",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Email change request error:", error);
    return NextResponse.json(
      { error: "Failed to process email change request" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { getEmailService } from "@/lib/email";
import {
  generateConfirmChangeHtml,
  generateConfirmChangeText,
  generateWelcomeNewEmailHtml,
  generateWelcomeNewEmailText,
} from "@/lib/email/emailChangeTemplates";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (!token) {
      return NextResponse.redirect(
        `${baseUrl}/account/profile?error=missing_token`
      );
    }

    // Find all pending requests that haven't expired
    const pendingRequests = await prisma.emailChangeRequest.findMany({
      where: {
        status: "PENDING",
        expires_at: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    // Find the matching request by comparing token hashes
    let matchingRequest = null;
    for (const req of pendingRequests) {
      const isMatch = await compare(token, req.token_hash);
      if (isMatch) {
        matchingRequest = req;
        break;
      }
    }

    if (!matchingRequest) {
      // Check if token was already used or expired
      const expiredOrUsed = await prisma.emailChangeRequest.findFirst({
        where: {
          OR: [
            { status: "VERIFIED" },
            { status: "EXPIRED" },
            { expires_at: { lte: new Date() } },
          ],
        },
        orderBy: { created_at: "desc" },
      });

      if (expiredOrUsed) {
        return NextResponse.redirect(
          `${baseUrl}/account/profile?error=token_expired`
        );
      }

      return NextResponse.redirect(
        `${baseUrl}/account/profile?error=invalid_token`
      );
    }

    const { user } = matchingRequest;
    const oldEmail = user.email;
    const newEmail = matchingRequest.new_email;
    const userName = `${user.first_name} ${user.last_name}`;
    const changedAt = new Date().toLocaleString("en-ZA", {
      dateStyle: "full",
      timeStyle: "short",
    });

    // Update user email
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        email: newEmail,
        emailVerified: new Date(),
      },
    });

    // Mark request as verified
    await prisma.emailChangeRequest.update({
      where: { id: matchingRequest.id },
      data: {
        status: "VERIFIED",
        verified_at: new Date(),
      },
    });

    // Invalidate all sessions for security
    await prisma.session.deleteMany({
      where: { userId: user.user_id },
    });

    // Log activity
    await prisma.userActivityLog.create({
      data: {
        user_id: user.user_id,
        activity_type: "EMAIL_CHANGED",
        ip_address: matchingRequest.ip_address,
        user_agent: matchingRequest.user_agent,
        success: true,
      },
    });

    // Send confirmation emails
    const emailService = getEmailService();

    // Confirm to old email
    await emailService.send({
      to: oldEmail,
      subject: "Your Yiba Verified email has been changed",
      html: generateConfirmChangeHtml({
        userName,
        oldEmail,
        newEmail,
        changedAt,
      }),
      text: generateConfirmChangeText({
        userName,
        oldEmail,
        newEmail,
        changedAt,
      }),
    });

    // Welcome to new email
    await emailService.send({
      to: newEmail,
      subject: "Welcome! Your email has been verified - Yiba Verified",
      html: generateWelcomeNewEmailHtml({
        userName,
        newEmail,
      }),
      text: generateWelcomeNewEmailText({
        userName,
        newEmail,
      }),
    });

    // Redirect to login with success message
    return NextResponse.redirect(
      `${baseUrl}/login?emailChanged=true`
    );
  } catch (error) {
    console.error("Email verification error:", error);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/account/profile?error=verification_failed`
    );
  }
}

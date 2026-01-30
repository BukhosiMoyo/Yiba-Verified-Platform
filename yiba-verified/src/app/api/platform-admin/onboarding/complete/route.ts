/**
 * POST /api/platform-admin/onboarding/complete
 *
 * Complete Platform Admin onboarding.
 * Uses direct Prisma update (no mutateWithAudit) to avoid audit-layer issues for this self-update.
 * Resolves user by email from session so the update works even when JWT userId doesn't match DB user_id.
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (ctx.role !== "PLATFORM_ADMIN") {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only Platform Admins can complete this onboarding",
          403
        )
      );
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return fail(
        new AppError(ERROR_CODES.UNAUTHENTICATED, "Session has no email", 401)
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { user_id: true },
    });
    if (!user) {
      return fail(
        new AppError(ERROR_CODES.NOT_FOUND, "User not found for this session", 404)
      );
    }

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        onboarding_completed: true,
        onboarding_completed_at: new Date(),
      },
    });

    revalidateTag("onboarding-status", {});

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    const message = error instanceof Error ? error.message : "Failed to complete onboarding";
    const details = error instanceof Error ? error.stack : String(error);
    console.error("POST /api/platform-admin/onboarding/complete error:", details);
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === "development" ? message : "Failed to complete onboarding",
        code: ERROR_CODES.INTERNAL_ERROR,
      },
      { status: 500 }
    );
  }
}

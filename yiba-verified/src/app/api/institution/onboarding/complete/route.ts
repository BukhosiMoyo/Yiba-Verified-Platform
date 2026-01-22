/**
 * POST /api/institution/onboarding/complete
 * 
 * Complete Institution Admin onboarding.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";

/**
 * POST /api/institution/onboarding/complete
 * Complete Institution Admin onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (ctx.role !== "INSTITUTION_ADMIN") {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only Institution Admins can complete this onboarding",
          403
        )
      );
    }

    // Mark onboarding as complete
    await mutateWithAudit({
      entityType: "USER",
      changeType: "UPDATE",
      fieldName: "onboarding_completed",
      oldValue: "false",
      newValue: "true",
      institutionId: ctx.institutionId || null,
      reason: "Complete Institution Admin onboarding",
      assertCan: async (tx, ctx) => {
        // User can update their own onboarding
      },
      mutation: async (tx, ctx) => {
        return await tx.user.update({
          where: { user_id: ctx.userId },
          data: {
            onboarding_completed: true,
            onboarding_completed_at: new Date(),
          },
        });
      },
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/institution/onboarding/complete error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to complete onboarding", 500)
    );
  }
}

// GET /api/student/onboarding/resume
// Returns saved progress for resuming onboarding

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // Only STUDENT role can access this endpoint
    if (ctx.role !== "STUDENT") {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only students can resume onboarding", 403);
    }

    // Get onboarding progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { user_id: ctx.userId },
    });

    if (!progress) {
      // No progress found - return initial state
      return ok({
        currentStep: 1,
        progress: null,
      });
    }

    return ok({
      currentStep: progress.current_step,
      progress: {
        personalInfo: progress.personal_info,
        addressInfo: progress.address_info,
        nextOfKinInfo: progress.next_of_kin_info,
        additionalInfo: progress.additional_info,
        popiaConsent: progress.popia_consent,
        pastQualifications: progress.past_qualifications,
        priorLearning: progress.prior_learning,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

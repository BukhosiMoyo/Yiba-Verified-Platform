// GET /api/student/onboarding/status
// Returns onboarding completion status and current progress

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
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only students can access onboarding status", 403);
    }

    // Get user with onboarding progress
    const user = await prisma.user.findUnique({
      where: { user_id: ctx.userId },
      select: {
        onboarding_completed: true,
        onboarding_completed_at: true,
        onboardingProgress: true,
        learner: {
          select: {
            learner_id: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    return ok({
      completed: user.onboarding_completed,
      completedAt: user.onboarding_completed_at,
      currentStep: user.onboardingProgress?.current_step ?? 1,
      hasLearnerRecord: !!user.learner,
      progress: user.onboardingProgress
        ? {
            personalInfo: user.onboardingProgress.personal_info,
            addressInfo: user.onboardingProgress.address_info,
            nextOfKinInfo: user.onboardingProgress.next_of_kin_info,
            additionalInfo: user.onboardingProgress.additional_info,
            popiaConsent: user.onboardingProgress.popia_consent,
            pastQualifications: user.onboardingProgress.past_qualifications,
            priorLearning: user.onboardingProgress.prior_learning,
          }
        : null,
    });
  } catch (error) {
    return fail(error);
  }
}

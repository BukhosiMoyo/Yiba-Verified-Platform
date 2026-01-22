// POST /api/student/onboarding/save
// Saves progress for a specific onboarding step

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // Only STUDENT role can access this endpoint
    if (ctx.role !== "STUDENT") {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only students can save onboarding progress", 403);
    }

    const body = await request.json();
    const { step, data, updateCurrentStep } = body;

    // Validate step
    if (typeof step !== "number" || step < 1 || step > 9 || !Number.isInteger(step)) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Step must be an integer between 1 and 9", 400);
    }

    // For auto-save or step navigation, data might be empty (just updating current_step)
    // Only require data for actual step content saves
    if (data && typeof data !== "object") {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Data must be an object if provided", 400);
    }

    // Get or create onboarding progress
    const existingProgress = await prisma.onboardingProgress.findUnique({
      where: { user_id: ctx.userId },
    });

    let progress;

    if (existingProgress) {
      // Update existing progress
      const updateData: any = {
        updated_at: new Date(),
      };

      // Update current_step if explicitly requested (for navigation) or if it's a higher step
      if (updateCurrentStep === true) {
        updateData.current_step = step;
      } else {
        // Otherwise, only advance forward (don't go backwards)
        updateData.current_step = Math.max(existingProgress.current_step, step);
      }

      // Map step number to field name
      switch (step) {
        case 2:
          updateData.personal_info = data;
          break;
        case 3:
          updateData.address_info = data;
          break;
        case 4:
          updateData.next_of_kin_info = data;
          break;
        case 5:
          updateData.additional_info = data;
          break;
        case 6:
          updateData.popia_consent = data.consent === true;
          updateData.popia_consent_date = data.consent === true ? new Date() : null;
          break;
        case 7:
          updateData.past_qualifications = data.qualifications || [];
          break;
        case 8:
          updateData.prior_learning = data.learning || [];
          break;
        default:
          // Steps 1 and 9 don't save data
          break;
      }

      progress = await prisma.onboardingProgress.update({
        where: { user_id: ctx.userId },
        data: updateData,
      });
    } else {
      // Create new progress
      const createData: any = {
        user_id: ctx.userId,
        current_step: step,
      };

      switch (step) {
        case 2:
          createData.personal_info = data;
          break;
        case 3:
          createData.address_info = data;
          break;
        case 4:
          createData.next_of_kin_info = data;
          break;
        case 5:
          createData.additional_info = data;
          break;
        case 6:
          createData.popia_consent = data.consent === true;
          createData.popia_consent_date = data.consent === true ? new Date() : null;
          break;
        case 7:
          createData.past_qualifications = data.qualifications || [];
          break;
        case 8:
          createData.prior_learning = data.learning || [];
          break;
      }

      progress = await prisma.onboardingProgress.create({
        data: createData,
      });
    }

    return ok({
      success: true,
      currentStep: progress.current_step,
    });
  } catch (error) {
    return fail(error);
  }
}

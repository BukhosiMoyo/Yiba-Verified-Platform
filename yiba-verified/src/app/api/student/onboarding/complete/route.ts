// POST /api/student/onboarding/complete
// Validates all required fields and creates Learner record

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
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only students can complete onboarding", 403);
    }

    if (!ctx.institutionId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Student must be associated with an institution", 400);
    }

    // Get user and onboarding progress
    const user = await prisma.user.findUnique({
      where: { user_id: ctx.userId },
      include: {
        onboardingProgress: true,
        learner: true,
      },
    });

    if (!user) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "User not found", 404);
    }

    // Check if already completed
    if (user.onboarding_completed && user.learner) {
      return ok({
        success: true,
        message: "Onboarding already completed",
        learnerId: user.learner.learner_id,
      });
    }

    if (!user.onboardingProgress) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "No onboarding progress found", 400);
    }

    const progress = user.onboardingProgress;

    // Validate all required fields
    const personalInfo = progress.personal_info as any;
    const addressInfo = progress.address_info as any;
    const nextOfKinInfo = progress.next_of_kin_info as any;
    const additionalInfo = progress.additional_info as any;

    const errors: string[] = [];

    // Validate Step 2: Personal Information
    if (!personalInfo?.national_id) errors.push("ID number is required");
    if (!personalInfo?.birth_date) errors.push("Date of birth is required");
    if (!personalInfo?.phone) errors.push("Phone number is required");
    if (!personalInfo?.gender_code) errors.push("Gender is required");
    if (!personalInfo?.nationality_code) errors.push("Nationality is required");

    // Validate Step 3: Address
    if (!addressInfo?.address) errors.push("Address is required");
    if (!addressInfo?.province) errors.push("Province is required");

    // Validate Step 4: Next of Kin
    if (!nextOfKinInfo?.name) errors.push("Next of kin name is required");
    if (!nextOfKinInfo?.relationship) errors.push("Next of kin relationship is required");
    if (!nextOfKinInfo?.phone) errors.push("Next of kin phone is required");

    // Validate Step 5: Additional Information
    if (!additionalInfo?.disability_status) errors.push("Disability status is required");
    if (!additionalInfo?.ethnicity) errors.push("Ethnicity is required");

    // Validate Step 6: POPIA Consent
    if (!progress.popia_consent) {
      errors.push("POPIA consent is required");
    }

    if (errors.length > 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Missing required fields: ${errors.join(", ")}`, 400);
    }

    // Check if national_id already exists
    const existingLearner = await prisma.learner.findUnique({
      where: { national_id: personalInfo.national_id },
    });

    if (existingLearner && existingLearner.user_id !== ctx.userId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "ID number already registered to another learner", 400);
    }

    // Learner create requires institution_id; update can keep existing or use ctx
    if (!existingLearner && !ctx.institutionId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Institution is required to complete onboarding", 400);
    }

    // Create Learner record in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Parse birth_date (should be ISO string)
      const birthDate = new Date(personalInfo.birth_date);
      if (isNaN(birthDate.getTime())) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid date of birth", 400);
      }

      // Create or update Learner record
      const learner = existingLearner
        ? await tx.learner.update({
            where: { learner_id: existingLearner.learner_id },
            data: {
              user_id: ctx.userId,
              institution_id: ctx.institutionId ?? undefined,
              national_id: personalInfo.national_id,
              alternate_id: personalInfo.alternate_id || null,
              first_name: user.first_name,
              last_name: user.last_name,
              birth_date: birthDate,
              gender_code: personalInfo.gender_code,
              nationality_code: personalInfo.nationality_code,
              home_language_code: personalInfo.home_language_code || null,
              disability_status: additionalInfo.disability_status,
              address: addressInfo.address,
              province: addressInfo.province,
              ethnicity: additionalInfo.ethnicity,
              next_of_kin_name: nextOfKinInfo.name,
              next_of_kin_relationship: nextOfKinInfo.relationship,
              next_of_kin_phone: nextOfKinInfo.phone,
              next_of_kin_address: nextOfKinInfo.address || null,
              popia_consent: true,
              consent_date: progress.popia_consent_date || new Date(),
            },
          })
        : await tx.learner.create({
            data: {
              user_id: ctx.userId,
              institution_id: ctx.institutionId!,
              national_id: personalInfo.national_id,
              alternate_id: personalInfo.alternate_id || null,
              first_name: user.first_name,
              last_name: user.last_name,
              birth_date: birthDate,
              gender_code: personalInfo.gender_code,
              nationality_code: personalInfo.nationality_code,
              home_language_code: personalInfo.home_language_code || null,
              disability_status: additionalInfo.disability_status,
              address: addressInfo.address,
              province: addressInfo.province,
              ethnicity: additionalInfo.ethnicity,
              next_of_kin_name: nextOfKinInfo.name,
              next_of_kin_relationship: nextOfKinInfo.relationship,
              next_of_kin_phone: nextOfKinInfo.phone,
              next_of_kin_address: nextOfKinInfo.address || null,
              popia_consent: true,
              consent_date: progress.popia_consent_date || new Date(),
            },
          });

      // Update user phone if provided
      if (personalInfo.phone) {
        await tx.user.update({
          where: { user_id: ctx.userId },
          data: { phone: personalInfo.phone },
        });
      }

      // Create PastQualification records if any
      const pastQualifications = (progress.past_qualifications as any[]) || [];
      if (pastQualifications.length > 0) {
        await Promise.all(
          pastQualifications.map((qual) =>
            tx.pastQualification.create({
              data: {
                learner_id: learner.learner_id,
                title: qual.title,
                institution: qual.institution || null,
                year_completed: qual.year_completed || null,
                document_id: qual.document_id || null,
              },
            })
          )
        );
      }

      // Create PriorLearning records if any
      const priorLearning = (progress.prior_learning as any[]) || [];
      if (priorLearning.length > 0) {
        await Promise.all(
          priorLearning.map((learning) =>
            tx.priorLearning.create({
              data: {
                learner_id: learner.learner_id,
                title: learning.title,
                description: learning.description || null,
                institution: learning.institution || null,
                start_date: learning.start_date ? new Date(learning.start_date) : null,
                end_date: learning.end_date ? new Date(learning.end_date) : null,
                is_current: learning.is_current || false,
              },
            })
          )
        );
      }

      // Mark onboarding as complete
      await tx.user.update({
        where: { user_id: ctx.userId },
        data: {
          onboarding_completed: true,
          onboarding_completed_at: new Date(),
        },
      });

      // Delete onboarding progress (no longer needed)
      await tx.onboardingProgress.delete({
        where: { user_id: ctx.userId },
      });

      return learner;
    });

    return ok({
      success: true,
      learnerId: result.learner_id,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    return fail(error);
  }
}

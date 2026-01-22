// GET /api/platform-admin/learners/[learnerId] - Get learner details (PLATFORM_ADMIN only)
// PATCH /api/platform-admin/learners/[learnerId] - Update learner (PLATFORM_ADMIN only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/platform-admin/learners/[learnerId]
 * Gets a single learner by ID (PLATFORM_ADMIN only).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ learnerId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { learnerId } = await params;

    // RBAC: Only PLATFORM_ADMIN
    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can access this endpoint",
        403
      );
    }

    // Query learner with all related data
    const learner = await prisma.learner.findUnique({
      where: {
        learner_id: learnerId,
        deleted_at: null,
      },
      select: {
        learner_id: true,
        institution_id: true,
        user_id: true,
        national_id: true,
        alternate_id: true,
        first_name: true,
        last_name: true,
        birth_date: true,
        gender_code: true,
        nationality_code: true,
        home_language_code: true,
        disability_status: true,
        popia_consent: true,
        consent_date: true,
        created_at: true,
        updated_at: true,
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
            status: true,
          },
        },
        user: {
          select: {
            user_id: true,
            email: true,
            role: true,
            status: true,
          },
        },
        enrolments: {
          where: { deleted_at: null },
          select: {
            enrolment_id: true,
            qualification_title: true,
            start_date: true,
            expected_completion_date: true,
            enrolment_status: true,
            attendance_percentage: true,
            assessment_centre_code: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
        },
        documents: {
          select: {
            document_id: true,
            document_type: true,
            file_name: true,
            file_size_bytes: true,
            uploaded_at: true,
            status: true,
          },
          orderBy: { uploaded_at: "desc" },
          take: 50,
        },
        _count: {
          select: {
            enrolments: true,
            documents: true,
          },
        },
      },
    });

    if (!learner) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Learner not found",
        404
      );
    }

    return ok({ learner });
  } catch (error) {
    return fail(error);
  }
}

/**
 * PATCH /api/platform-admin/learners/[learnerId]
 * Updates a learner (PLATFORM_ADMIN only).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ learnerId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { learnerId } = await params;

    // RBAC: Only PLATFORM_ADMIN
    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can access this endpoint",
        403
      );
    }

    const body = await request.json();
    const { ...updateData } = body;

    // Check if learner exists
    const existingLearner = await prisma.learner.findUnique({
      where: { learner_id: learnerId },
    });

    if (!existingLearner || existingLearner.deleted_at) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Learner not found",
        404
      );
    }

    // Validate national_id uniqueness if being updated
    if (updateData.national_id && updateData.national_id !== existingLearner.national_id) {
      const idExists = await prisma.learner.findFirst({
        where: {
          national_id: updateData.national_id,
          deleted_at: null,
          learner_id: { not: learnerId },
        },
      });
      if (idExists) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "National ID already in use",
          400
        );
      }
    }

    // Update learner
    const updatedLearner = await prisma.learner.update({
      where: { learner_id: learnerId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      select: {
        learner_id: true,
        national_id: true,
        first_name: true,
        last_name: true,
        birth_date: true,
        gender_code: true,
        nationality_code: true,
        home_language_code: true,
        disability_status: true,
        created_at: true,
        updated_at: true,
      },
    });

    return ok(updatedLearner);
  } catch (error) {
    return fail(error);
  }
}

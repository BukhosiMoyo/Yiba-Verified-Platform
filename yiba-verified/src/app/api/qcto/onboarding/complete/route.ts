/**
 * POST /api/qcto/onboarding/complete
 * 
 * Complete QCTO onboarding by setting province assignments.
 * 
 * Body:
 * {
 *   default_province: string,
 *   assigned_provinces: string[]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { validateProvinceAssignment } from "@/lib/security/validation";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";

interface CompleteOnboardingBody {
  default_province: string;
  assigned_provinces: string[];
}

/**
 * POST /api/qcto/onboarding/complete
 * Complete QCTO onboarding
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // Check if user is a QCTO role
    const QCTO_ROLES = [
      "QCTO_SUPER_ADMIN",
      "QCTO_ADMIN",
      "QCTO_USER",
      "QCTO_REVIEWER",
      "QCTO_AUDITOR",
      "QCTO_VIEWER",
    ];

    if (!QCTO_ROLES.includes(ctx.role)) {
      return fail(
        new AppError(
          ERROR_CODES.FORBIDDEN,
          "Only QCTO users can complete QCTO onboarding",
          403
        )
      );
    }

    const body: CompleteOnboardingBody = await request.json();

    // Validate province assignment
    validateProvinceAssignment(ctx.role, body.default_province, body.assigned_provinces);

    // Update user with province assignments and mark onboarding as complete
    await mutateWithAudit({
      entityType: "USER",
      changeType: "UPDATE",
      fieldName: "onboarding_completed",
      oldValue: "false",
      newValue: "true",
      institutionId: null,
      reason: "Complete QCTO onboarding with province assignments",
      assertCan: async (tx, ctx) => {
        // User can update their own onboarding
      },
      mutation: async (tx, ctx) => {
        return await tx.user.update({
          where: { user_id: ctx.userId },
          data: {
            default_province: body.default_province,
            assigned_provinces: body.assigned_provinces,
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
    console.error("POST /api/qcto/onboarding/complete error:", error);
    return fail(
      new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to complete onboarding", 500)
    );
  }
}

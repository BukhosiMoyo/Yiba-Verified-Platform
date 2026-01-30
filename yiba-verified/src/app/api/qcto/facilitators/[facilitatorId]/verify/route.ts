// POST /api/qcto/facilitators/[facilitatorId]/verify - Verify or reject a facilitator
//
// Security rules:
// - QCTO_USER, QCTO_ADMIN, QCTO_REVIEWER: can verify facilitators
// - PLATFORM_ADMIN: can verify any facilitator
//
// Body:
// {
//   "verification_status": "VERIFIED" | "REJECTED",
//   "verification_notes": string (optional)
// }
//
// Returns:
// {
//   ...updated facilitator...
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { canAccessQctoData } from "@/lib/rbac";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { assertCanReadForQCTO } from "@/lib/api/qctoAccess";
import { mutateWithAudit } from "@/server/mutations/mutate";

interface RouteParams {
  params: Promise<{ facilitatorId: string }>;
}

type VerifyFacilitatorBody = {
  verification_status: "VERIFIED" | "REJECTED";
  verification_notes?: string;
};

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { facilitatorId } = await params;
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot verify facilitators`,
        403
      );
    }

    // Check access (throws if denied)
    await assertCanReadForQCTO(ctx, "FACILITATOR", facilitatorId);

    const body: VerifyFacilitatorBody = await request.json();

    if (!body.verification_status || !["VERIFIED", "REJECTED"].includes(body.verification_status)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "verification_status must be VERIFIED or REJECTED",
        400
      );
    }

    // Get current facilitator
    const facilitator = await prisma.facilitator.findUnique({
      where: { facilitator_id: facilitatorId },
      select: {
        facilitator_id: true,
        verification_status: true,
      },
    });

    if (!facilitator) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `Facilitator not found: ${facilitatorId}`,
        404
      );
    }

    // Update facilitator verification status (access already checked via assertCanReadForQCTO)
    const updated = await mutateWithAudit({
      ctx,
      entityType: "FACILITATOR",
      changeType: "UPDATE",
      entityId: facilitatorId,
      fieldName: "verification_status",
      oldValue: facilitator.verification_status || null,
      newValue: body.verification_status,
      reason: `Verify facilitator: ${body.verification_status}`,
      allowQctoReviewOperations: true,
      assertCan: async () => {},
      mutation: async (tx, ctx) => {
        return await tx.facilitator.update({
          where: { facilitator_id: facilitatorId },
          data: {
            verification_status: body.verification_status,
            verified_by: ctx.userId,
            verified_at: new Date(),
            verification_notes: body.verification_notes || null,
          },
          include: {
            readiness: {
              include: {
                institution: {
                  select: {
                    institution_id: true,
                    legal_name: true,
                    trading_name: true,
                  },
                },
              },
            },
            certifications: true,
          },
        });
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/qcto/facilitators/[facilitatorId]/verify error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Failed to verify facilitator" },
      { status: 500 }
    );
  }
}

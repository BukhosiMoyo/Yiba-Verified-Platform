// GET /api/qcto/facilitators/[facilitatorId] - Get facilitator details
//
// Security rules:
// - QCTO_USER: can view if facilitator is in APPROVED submission/request
// - PLATFORM_ADMIN: can view any facilitator
//
// Returns:
// {
//   ...facilitator with relations...
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { canAccessQctoData } from "@/lib/rbac";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { assertCanReadForQCTO } from "@/lib/api/qctoAccess";

interface RouteParams {
  params: Promise<{ facilitatorId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { facilitatorId } = await params;
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot view facilitators`,
        403
      );
    }

    // Check access (throws if denied)
    await assertCanReadForQCTO(ctx, "FACILITATOR", facilitatorId);

    // Fetch facilitator with all relations
    const facilitator = await prisma.facilitator.findUnique({
      where: { facilitator_id: facilitatorId },
      include: {
        readiness: {
          select: {
            qualification_title: true,
            saqa_id: true,
            nqf_level: true,
            readiness_status: true,
            institution: {
              select: {
                institution_id: true,
                legal_name: true,
                trading_name: true,
                registration_number: true,
                province: true,
              },
            },
          },
        },
        documents: {
          include: {
            documentFlags: {
              where: { status: { not: "RESOLVED" } },
              include: {
                flaggedBy: {
                  select: {
                    user_id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { uploaded_at: "desc" },
        },
        certifications: {
          include: {
            document: {
              select: {
                document_id: true,
                file_name: true,
                document_type: true,
              },
            },
          },
          orderBy: [
            { expiry_date: "asc" },
            { certification_name: "asc" },
          ],
        },
        moduleCompletions: {
          include: {
            enrolment: {
              include: {
                learner: {
                  select: {
                    learner_id: true,
                    first_name: true,
                    last_name: true,
                    national_id: true,
                  },
                },
                qualification: {
                  select: {
                    qualification_id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
          take: 50,
          orderBy: { completion_date: "desc" },
        },
        verifiedByUser: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        user: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
            facilitator_profile_complete: true,
          },
        },
      },
    });

    if (!facilitator) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `Facilitator not found: ${facilitatorId}`,
        404
      );
    }

    return NextResponse.json(facilitator, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/qcto/facilitators/[facilitatorId] error:", error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Failed to fetch facilitator" },
      { status: 500 }
    );
  }
}

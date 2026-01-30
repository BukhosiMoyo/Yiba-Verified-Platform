// GET /api/platform-admin/qualifications/[qualificationId] - Single qualification with extra details (PLATFORM_ADMIN only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qualificationId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { qualificationId } = await params;

    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can view qualification details",
        403
      );
    }

    const qualification = await prisma.qualification.findFirst({
      where: { qualification_id: qualificationId, deleted_at: null },
      select: {
        qualification_id: true,
        name: true,
        code: true,
        created_at: true,
        updated_at: true,
        _count: { select: { enrolments: true } },
        enrolments: {
          take: 20,
          orderBy: { created_at: "desc" },
          select: {
            enrolment_id: true,
            qualification_title: true,
            enrolment_status: true,
            start_date: true,
            created_at: true,
            institution_id: true,
            institution: { select: { legal_name: true, trading_name: true } },
            learner_id: true,
            learner: { select: { first_name: true, last_name: true } },
          },
        },
      },
    });

    if (!qualification) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Qualification not found", 404);
    }

    return ok(qualification);
  } catch (error) {
    return fail(error);
  }
}

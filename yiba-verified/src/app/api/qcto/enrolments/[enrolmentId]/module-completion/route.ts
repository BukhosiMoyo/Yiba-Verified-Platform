// GET /api/qcto/enrolments/[enrolmentId]/module-completion - Get module completion for an enrolment
//
// Security rules:
// - QCTO_USER: can view if enrolment is in APPROVED submission/request
// - PLATFORM_ADMIN: can view any enrolment
//
// Returns:
// {
//   "modules": [ ...moduleCompletions... ],
//   "summary": {
//     "total": number,
//     "completed": number,
//     "in_progress": number,
//     "not_started": number,
//     "failed": number,
//     "completion_rate": number
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { canAccessQctoData } from "@/lib/rbac";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { assertCanReadForQCTO } from "@/lib/api/qctoAccess";

interface RouteParams {
  params: Promise<{ enrolmentId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { enrolmentId } = await params;
  try {
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot view module completion`,
        403
      );
    }

    // Check access (throws if denied)
    try {
      await assertCanReadForQCTO(ctx, "ENROLMENT", enrolmentId);
    } catch (accessError: any) {
      console.error("Access check failed for enrolment:", enrolmentId, accessError);
      throw accessError;
    }

    // Fetch module completions
    const modules = await prisma.moduleCompletion.findMany({
      where: {
        enrolment_id: enrolmentId,
      },
      include: {
        facilitator: {
          select: {
            facilitator_id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: [
        { module_type: "asc" },
        { module_name: "asc" },
      ],
    });

    // Calculate summary statistics
    const total = modules.length;
    const completed = modules.filter((m) => m.status === "COMPLETED").length;
    const inProgress = modules.filter((m) => m.status === "IN_PROGRESS").length;
    const notStarted = modules.filter((m) => m.status === "NOT_STARTED").length;
    const failed = modules.filter((m) => m.status === "FAILED").length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return NextResponse.json(
      {
        modules,
        summary: {
          total,
          completed,
          in_progress: inProgress,
          not_started: notStarted,
          failed,
          completion_rate: completionRate,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/qcto/enrolments/[enrolmentId]/module-completion error:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      enrolmentId,
    });
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to fetch module completion" },
      { status: 500 }
    );
  }
}

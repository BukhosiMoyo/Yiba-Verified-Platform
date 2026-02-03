
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { JobRequestStatus } from "@prisma/client";

// PATCH /api/talent/opportunities/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { ctx } = await requireAuth(request);
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        // Allow only specific transitions
        const allowedStatuses = [JobRequestStatus.VIEWED, JobRequestStatus.ARCHIVED];
        if (!allowedStatuses.includes(status)) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid status", 400);
        }

        const opportunity = await prisma.jobOpportunityRequest.findFirst({
            where: {
                id,
                candidate_user_id: ctx.userId
            }
        });

        if (!opportunity) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "Opportunity not found", 404);
        }

        const updated = await prisma.jobOpportunityRequest.update({
            where: { id },
            data: { status }
        });

        return ok(updated);
    } catch (err) {
        return fail(err);
    }
}


import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { JobRequestStatus } from "@prisma/client";

// GET /api/talent/opportunities
export async function GET(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        // Fetch Inbox
        const opportunities = await prisma.jobOpportunityRequest.findMany({
            where: {
                candidate_user_id: ctx.userId,
                status: {
                    in: [
                        JobRequestStatus.VERIFIED_SENT,
                        JobRequestStatus.VIEWED,
                        JobRequestStatus.ARCHIVED
                    ]
                }
            },
            orderBy: {
                created_at: "desc"
            }
        });

        return ok(opportunities);
    } catch (err) {
        return fail(err);
    }
}

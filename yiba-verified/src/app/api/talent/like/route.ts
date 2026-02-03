
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);
        const body = await request.json();
        const { profileId } = body;

        if (!profileId) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "profileId required", 400);
        }

        // Check if already liked
        const existing = await prisma.talentLike.findUnique({
            where: {
                liked_profile_id_user_id: {
                    liked_profile_id: profileId,
                    user_id: ctx.userId
                }
            }
        });

        if (existing) {
            // Unlike
            await prisma.talentLike.delete({
                where: { id: existing.id }
            });
            return ok({ liked: false });
        } else {
            // Like
            await prisma.talentLike.create({
                data: {
                    liked_profile_id: profileId,
                    user_id: ctx.userId
                }
            });
            return ok({ liked: true });
        }

    } catch (err) {
        return fail(err);
    }
}

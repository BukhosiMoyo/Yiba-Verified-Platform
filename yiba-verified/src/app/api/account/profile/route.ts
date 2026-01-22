// PATCH /api/account/profile - Update current user's first name and last name

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function PATCH(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);
    const body = await request.json();
    const first_name = typeof body.first_name === "string" ? body.first_name.trim() : "";
    const last_name = typeof body.last_name === "string" ? body.last_name.trim() : "";

    if (!first_name || !last_name) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "first_name and last_name are required and must be non-empty",
        400
      );
    }

    await prisma.user.update({
      where: { user_id: ctx.userId, deleted_at: null },
      data: { first_name, last_name },
    });

    return ok({});
  } catch (err) {
    return fail(err);
  }
}

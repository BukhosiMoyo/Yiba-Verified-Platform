// PATCH /api/institution/invites/[inviteId] - Edit invite (role, extend expiry)
// INSTITUTION_ADMIN only; invite must belong to their institution. Cannot edit used invites.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

const ALLOWED_ROLES = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "STUDENT"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);

    if (ctx.role !== "INSTITUTION_ADMIN") {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only INSTITUTION_ADMIN can edit invites", 403);
    }

    if (!ctx.institutionId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "User must be associated with an institution", 400);
    }

    const { inviteId } = await params;

    const invite = await prisma.invite.findFirst({
      where: {
        invite_id: inviteId,
        institution_id: ctx.institutionId,
        deleted_at: null,
      },
    });

    if (!invite) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Invite not found", 404);
    }

    if (invite.used_at) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Cannot edit a used invite", 400);
    }

    const body = await request.json();
    const { role, extend_expiry } = body;

    const data: { role?: (typeof ALLOWED_ROLES)[number]; expires_at?: Date } = {};

    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "role must be INSTITUTION_ADMIN, INSTITUTION_STAFF, or STUDENT", 400);
      }
      data.role = role as (typeof ALLOWED_ROLES)[number];
    }

    if (extend_expiry === true) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      data.expires_at = d;
    }

    if (Object.keys(data).length === 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Provide role and/or extend_expiry", 400);
    }

    const updated = await prisma.invite.update({
      where: { invite_id: inviteId },
      data,
      select: {
        invite_id: true,
        email: true,
        role: true,
        expires_at: true,
        used_at: true,
      },
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

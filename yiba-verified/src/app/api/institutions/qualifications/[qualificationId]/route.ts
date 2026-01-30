// GET /api/institutions/qualifications/[qualificationId] - Single qualification (safe fields only)
// Institution users: can read ACTIVE; non-ACTIVE only if linked to their readiness.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

const ALLOWED_ROLES = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"] as const;

const SAFE_SELECT = {
  id: true,
  name: true,
  status: true,
  saqa_id: true,
  curriculum_code: true,
  nqf_level: true,
  credits: true,
  occupational_category: true,
  description: true,
  updated_at: true,
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qualificationId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { qualificationId } = await params;

    if (!ALLOWED_ROLES.includes(ctx.role as (typeof ALLOWED_ROLES)[number])) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Insufficient permissions to view qualification",
        403
      );
    }

    if (
      (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") &&
      !ctx.institutionId
    ) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Institution ID required for institution roles",
        403
      );
    }

    const item = await prisma.qualificationRegistry.findFirst({
      where: { id: qualificationId, deleted_at: null },
      select: SAFE_SELECT,
    });

    if (!item) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Qualification not found", 404);
    }

    // Institution roles: ACTIVE and DRAFT always; other statuses only if linked to their readiness
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      const institutionId = ctx.institutionId!;
      if (item.status !== "ACTIVE" && item.status !== "DRAFT") {
        const linked = await prisma.readiness.count({
          where: {
            institution_id: institutionId,
            qualification_registry_id: qualificationId,
            deleted_at: null,
          },
        });
        if (linked === 0) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            "You can only view non-active qualifications that are linked to your institution's readiness records",
            403
          );
        }
      }
    }

    return ok(item);
  } catch (error) {
    return fail(error);
  }
}

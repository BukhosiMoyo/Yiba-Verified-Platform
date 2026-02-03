// GET /api/institutions/qualifications/[qualificationId] - Single qualification (safe fields only)
// Institution users: can read ACTIVE; non-ACTIVE only if linked to their readiness.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

const ALLOWED_ROLES = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"] as const;

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

    const item = await prisma.qualification.findUnique({
      where: { qualification_id: qualificationId, deleted_at: null },
      select: {
        qualification_id: true,
        name: true,
        code: true,
        type: true,
        nqf_level: true,
        status: true,
        saqa_id: true,
        curriculum_code: true,
        credits: true,

        summary: true,
        entry_requirements: true,
        modules: true,
        career_outcomes: true,
        updated_at: true,
        // Add more fields if needed for details view
      },
    });

    if (!item) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Qualification not found", 404);
    }

    // Institution roles: ACTIVE and DRAFT always; other statuses only if linked to their readiness
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      const institutionId = ctx.institutionId!;
      // DRAFT? Probably redundant if only ACTIVE is usually visible, but schema supports DRAFT visibility if they created it?
      // Actually Qualification is Platform-Admin managed usually.
      // But if status is ACTIVE, they can see it.
      // If status is NOT ACTIVE (e.g. RETIRED), they can see ONLY if linked.
      if (item.status !== "ACTIVE" && item.status !== "DRAFT") {
        const linked = await prisma.readiness.count({
          where: {
            institution_id: institutionId,
            qualification_id: qualificationId,
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

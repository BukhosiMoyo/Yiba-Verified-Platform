// GET /api/platform-admin/institutions/[institutionId]/learners
// Paginated learners for an institution. Query: page, limit, q.
// Returns { items, total, page, limit }.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Prisma } from "@prisma/client";

const LIMIT_OPTIONS = [10, 25, 50, 100] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ institutionId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { institutionId } = await params;

    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can access this endpoint",
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limitParam = parseInt(searchParams.get("limit") || "10", 10);
    const limit = (LIMIT_OPTIONS as readonly number[]).includes(limitParam)
      ? limitParam
      : 10;
    const q = (searchParams.get("q") || "").trim();

    // Ensure institution exists and is not deleted
    const inst = await prisma.institution.findFirst({
      where: { institution_id: institutionId, deleted_at: null },
      select: { institution_id: true },
    });
    if (!inst) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Institution not found", 404);
    }

    const where: Prisma.LearnerWhereInput = {
      institution_id: institutionId,
      deleted_at: null,
    };
    if (q) {
      where.OR = [
        { first_name: { contains: q, mode: "insensitive" } },
        { last_name: { contains: q, mode: "insensitive" } },
        { national_id: { contains: q, mode: "insensitive" } },
        { alternate_id: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.learner.findMany({
        where,
        select: {
          learner_id: true,
          national_id: true,
          alternate_id: true,
          first_name: true,
          last_name: true,
          created_at: true,
          user_id: true,
          user: { select: { email: true } },
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.learner.count({ where }),
    ]);

    return ok({ items, total, page, limit });
  } catch (e) {
    return fail(e);
  }
}

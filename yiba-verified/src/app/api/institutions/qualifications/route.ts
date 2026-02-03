// GET /api/institutions/qualifications - List qualifications for institution (read-only)
// Institution users: ACTIVE only by default, or qualifications linked to their readiness.
// PLATFORM_ADMIN: list all with optional filters.

import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

const ALLOWED_ROLES = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"] as const;

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!ALLOWED_ROLES.includes(ctx.role as (typeof ALLOWED_ROLES)[number])) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Insufficient permissions to list qualifications",
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

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const statusParam = searchParams.get("status") || "";
    const nqfLevelParam = searchParams.get("nqf_level") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const where: Prisma.QualificationWhereInput = {
      deleted_at: null,
    };

    // Institution roles: ACTIVE + DRAFT (so they can search/apply), or any status linked to their readiness
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      const institutionId = ctx.institutionId!;
      where.AND = [
        {
          OR: [
            { status: "ACTIVE" },
            { status: "DRAFT" },
            {
              readinessRecords: {
                some: { institution_id: institutionId },
              },
            },
          ],
        },
      ];
      // When status filter is provided, additionally filter by it (e.g. ACTIVE only)
      if (statusParam && ["ACTIVE", "INACTIVE", "RETIRED", "DRAFT"].includes(statusParam)) {
        where.status = statusParam as "ACTIVE" | "INACTIVE" | "RETIRED" | "DRAFT";
      }
    } else {
      // PLATFORM_ADMIN: optional status and nqf_level filters
      if (statusParam && ["ACTIVE", "INACTIVE", "RETIRED", "DRAFT"].includes(statusParam)) {
        where.status = statusParam as "ACTIVE" | "INACTIVE" | "RETIRED" | "DRAFT";
      }
    }

    if (nqfLevelParam && !isNaN(parseInt(nqfLevelParam, 10))) {
      where.nqf_level = parseInt(nqfLevelParam, 10);
    }

    if (q.length >= 1) {
      const searchClause = {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { code: { contains: q, mode: "insensitive" as const } },
          { saqa_id: { contains: q, mode: "insensitive" as const } },
          { curriculum_code: { contains: q, mode: "insensitive" as const } },
        ],
      };
      where.AND = Array.isArray(where.AND) ? [...where.AND, searchClause] : [searchClause];
    }

    const [items, total] = await Promise.all([
      prisma.qualification.findMany({
        where,
        select: {
          qualification_id: true,
          name: true,
          code: true,
          saqa_id: true,
          curriculum_code: true,
          nqf_level: true,
          type: true,
          status: true,
          updated_at: true,
        },
        orderBy: { name: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.qualification.count({ where }),
    ]);

    return ok({ items, total });
  } catch (error) {
    return fail(error);
  }
}

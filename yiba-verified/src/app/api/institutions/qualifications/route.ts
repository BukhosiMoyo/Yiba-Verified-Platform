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

// #region agent log
const DEBUG_LOG = (payload: {
  location: string;
  message: string;
  data: Record<string, unknown>;
  hypothesisId?: string;
}) => {
  fetch("http://127.0.0.1:7242/ingest/a3a957bf-fd91-43b2-abbc-191f81673693", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      timestamp: Date.now(),
      sessionId: "debug-session",
    }),
  }).catch(() => {});
};
// #endregion

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // #region agent log
    DEBUG_LOG({
      location: "api/institutions/qualifications/route.ts:GET:entry",
      message: "Institution qualifications GET: auth context",
      data: {
        role: ctx.role,
        institutionId: ctx.institutionId ?? null,
        hasInstitutionId: !!ctx.institutionId,
      },
      hypothesisId: "A",
    });
    // #endregion

    if (!ALLOWED_ROLES.includes(ctx.role as (typeof ALLOWED_ROLES)[number])) {
      // #region agent log
      DEBUG_LOG({
        location: "api/institutions/qualifications/route.ts:GET:role-rejected",
        message: "Role not allowed for qualifications",
        data: { role: ctx.role },
        hypothesisId: "B",
      });
      // #endregion
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
      // #region agent log
      DEBUG_LOG({
        location: "api/institutions/qualifications/route.ts:GET:no-institution",
        message: "Institution ID required but missing",
        data: { role: ctx.role },
        hypothesisId: "C",
      });
      // #endregion
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

    const where: Prisma.QualificationRegistryWhereInput = {
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
              readiness_records: {
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
          { aliases: { some: { alias: { contains: q, mode: "insensitive" as const } } } },
        ],
      };
      where.AND = Array.isArray(where.AND) ? [...where.AND, searchClause] : [searchClause];
    }

    const [items, total] = await Promise.all([
      prisma.qualificationRegistry.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          saqa_id: true,
          curriculum_code: true,
          nqf_level: true,
          credits: true,
          occupational_category: true,
          description: true,
          status: true,
          updated_at: true,
        },
        orderBy: { name: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.qualificationRegistry.count({ where }),
    ]);

    // #region agent log
    DEBUG_LOG({
      location: "api/institutions/qualifications/route.ts:GET:success",
      message: "Qualifications list returned",
      data: {
        role: ctx.role,
        institutionId: ctx.institutionId ?? null,
        total,
        itemsLength: items.length,
        statusParam,
      },
      hypothesisId: "D",
    });
    // #endregion

    return ok({ items, total });
  } catch (error) {
    // #region agent log
    DEBUG_LOG({
      location: "api/institutions/qualifications/route.ts:GET:error",
      message: "Qualifications GET failed",
      data: {
        errorMessage: error instanceof Error ? error.message : String(error),
        code: (error as { code?: string })?.code,
      },
      hypothesisId: "E",
    });
    // #endregion
    return fail(error);
  }
}

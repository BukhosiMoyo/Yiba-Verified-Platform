// GET /api/qcto/readiness - List readiness records (QCTO_USER and PLATFORM_ADMIN)
//
// Query params:
//   ?q=string - Search in qualification_title, saqa_id, institution legal_name/trading_name (min 2 chars)
//   ?status=ReadinessStatus - Filter by readiness_status
//   ?province=string - Filter by institution.province
//   ?limit=number - Default 50, max 200
//   ?offset=number - For pagination
//
// Returns: { count: number, items: Readiness[] }

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";
import { getProvinceFilterForQCTO } from "@/lib/api/qctoAccess";

const VALID_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "RETURNED_FOR_CORRECTION",
  "REVIEWED",
  "RECOMMENDED",
  "REJECTED",
];

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only QCTO and platform administrators can access this endpoint",
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const qParam = searchParams.get("q")?.trim() || "";
    const statusParam = searchParams.get("status") || "";
    const provinceParam = searchParams.get("province")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const where: any = { deleted_at: null };

    if (statusParam && VALID_STATUSES.includes(statusParam)) {
      where.readiness_status = statusParam;
    }

    // Get province filter based on user's assigned provinces
    const provinceFilter = await getProvinceFilterForQCTO(ctx);
    
    // Apply province filtering to institution
    if (provinceFilter !== null) {
      // User has assigned provinces - filter institutions to those provinces
      if (provinceFilter.length === 0) {
        // No provinces assigned - return empty result
        return Response.json({ count: 0, items: [] }, { status: 200 });
      }
      where.institution = {
        ...where.institution,
        province: { in: provinceFilter },
      };
    }

    // If user explicitly requested a specific province (and they have access), apply it
    if (provinceParam) {
      if (provinceFilter === null || provinceFilter.includes(provinceParam)) {
        where.institution = {
          ...where.institution,
          province: provinceParam, // Override with specific province
        };
      } else {
        // User requested province they don't have access to - return empty
        return Response.json({ count: 0, items: [] }, { status: 200 });
      }
    }

    if (qParam.length >= 2) {
      where.AND = [
        {
          OR: [
            { qualification_title: { contains: qParam, mode: "insensitive" } },
            { saqa_id: { contains: qParam, mode: "insensitive" } },
            { institution: { legal_name: { contains: qParam, mode: "insensitive" } } },
            { institution: { trading_name: { contains: qParam, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const [items, count] = await Promise.all([
      prisma.readiness.findMany({
        where,
        include: {
          institution: {
            select: {
              institution_id: true,
              legal_name: true,
              trading_name: true,
              province: true,
            },
          },
          recommendation: {
            select: {
              recommendation_id: true,
              recommendation: true,
              remarks: true,
              created_at: true,
            },
          },
          _count: { select: { documents: true } },
        },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.readiness.count({ where }),
    ]);

    return Response.json({ count, items }, { status: 200 });
  } catch (error) {
    return fail(error);
  }
}

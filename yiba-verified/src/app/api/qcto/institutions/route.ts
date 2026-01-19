// GET /api/qcto/institutions - List all institutions (QCTO_USER and PLATFORM_ADMIN)
//
// Query params:
//   ?q=searchText - Search in legal_name, trading_name, or registration_number
//   ?limit=number - Limit results (default: 50, max: 200)
//   ?offset=number - Offset for pagination

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/qcto/institutions
 * Lists all institutions. QCTO_USER and PLATFORM_ADMIN can access (read-only for QCTO).
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (ctx.role !== "QCTO_USER" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only QCTO_USER and PLATFORM_ADMIN can access this endpoint",
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = Math.min(limitParam ? parseInt(limitParam, 10) : 50, 200);
    const offset = Math.max(0, offsetParam ? parseInt(offsetParam, 10) : 0);

    if (isNaN(limit) || limit < 1) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid limit parameter (must be a positive number)",
        400
      );
    }

    if (isNaN(offset) || offset < 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid offset parameter (must be a non-negative number)",
        400
      );
    }

    const where: any = { deleted_at: null };

    if (searchQuery.trim()) {
      where.OR = [
        { legal_name: { contains: searchQuery, mode: "insensitive" } },
        { trading_name: { contains: searchQuery, mode: "insensitive" } },
        { registration_number: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    const total = await prisma.institution.count({ where });

    const institutions = await prisma.institution.findMany({
      where,
      select: {
        institution_id: true,
        legal_name: true,
        trading_name: true,
        province: true,
        registration_number: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    });

    return ok({
      count: institutions.length,
      total,
      items: institutions,
    });
  } catch (error) {
    return fail(error);
  }
}

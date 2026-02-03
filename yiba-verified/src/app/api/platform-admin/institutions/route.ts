// GET /api/platform-admin/institutions - List all institutions (PLATFORM_ADMIN only)
//
// Query params:
//   ?q=searchText - Search in legal_name, trading_name, or registration_number
//   ?limit=number - Limit results (default: 50, max: 200)
//   ?offset=number - Offset for pagination
//
// Example:
//   curl -sS https://yibaverified.co.za/api/platform-admin/institutions \
//     -H "X-DEV-TOKEN: <DEV_TOKEN>" | jq

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/platform-admin/institutions
 * Lists all institutions (PLATFORM_ADMIN only).
 * 
 * RBAC: Only PLATFORM_ADMIN can access this endpoint.
 * 
 * Returns:
 * {
 *   "count": number,
 *   "items": Institution[]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Only PLATFORM_ADMIN
    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can access this endpoint",
        403
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const limit = Math.min(
      limitParam ? parseInt(limitParam, 10) : 50,
      200 // Cap at 200
    );
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

    // Build where clause
    const where: any = {
      deleted_at: null, // Only non-deleted institutions
    };

    // Add search filter if provided
    if (searchQuery.trim()) {
      where.OR = [
        { legal_name: { contains: searchQuery, mode: "insensitive" } },
        { trading_name: { contains: searchQuery, mode: "insensitive" } },
        { registration_number: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Get total count (for pagination)
    const total = await prisma.institution.count({ where });

    // Query institutions
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
      orderBy: {
        created_at: "desc", // Newest first
      },
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

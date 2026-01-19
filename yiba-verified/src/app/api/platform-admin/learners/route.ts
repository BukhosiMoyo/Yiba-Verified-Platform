// GET /api/platform-admin/learners - List all learners (PLATFORM_ADMIN only)
//
// Query params:
//   ?institution_id=uuid - Filter by institution (optional but recommended)
//   ?q=searchText - Search in national_id, first_name, last_name
//   ?limit=number - Limit results (default: 50, max: 200)
//   ?offset=number - Offset for pagination
//
// Example:
//   curl -sS "http://localhost:3000/api/platform-admin/learners?institution_id=<ID>" \
//     -H "X-DEV-TOKEN: <DEV_TOKEN>" | jq

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/platform-admin/learners
 * Lists learners (PLATFORM_ADMIN only).
 * 
 * RBAC: Only PLATFORM_ADMIN can access this endpoint.
 * 
 * Can filter by institution_id (recommended for large datasets).
 * 
 * Returns:
 * {
 *   "count": number,
 *   "total": number,
 *   "items": Learner[]
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
    const institutionId = searchParams.get("institution_id") || undefined;
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
      deleted_at: null, // Only non-deleted learners
    };

    // Filter by institution if provided
    // If q is provided but institution_id is not, allow cross-institution search (for search functionality)
    if (institutionId) {
      where.institution_id = institutionId;
    } else if (!searchQuery.trim()) {
      // If no search query and no institution_id, require institution_id to prevent dumping all learners
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Either institution_id or search query (q) must be provided",
        400
      );
    }

    // Add search filter if provided
    if (searchQuery.trim()) {
      where.OR = [
        { national_id: { contains: searchQuery, mode: "insensitive" } },
        { first_name: { contains: searchQuery, mode: "insensitive" } },
        { last_name: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Get total count (for pagination)
    const total = await prisma.learner.count({ where });

    // Query learners with institution info
    const learners = await prisma.learner.findMany({
      where,
      select: {
        learner_id: true,
        national_id: true,
        first_name: true,
        last_name: true,
        institution_id: true,
        created_at: true,
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc", // Newest first
      },
      skip: offset,
      take: limit,
    });

    return ok({
      count: learners.length,
      total,
      items: learners,
    });
  } catch (error) {
    return fail(error);
  }
}

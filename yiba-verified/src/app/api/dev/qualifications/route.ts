// GET /api/dev/qualifications - Dev-only endpoint to list qualifications
// ONLY available in development mode (NODE_ENV === "development")
// Requires X-DEV-TOKEN header for authentication
//
// Query params:
//   ?q=searchText - Search in name or code
//   ?limit=number - Limit results (default: 50, max: 100)
//
// Example:
//   export BASE_URL="https://yibaverified.co.za"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -sS "$BASE_URL/api/dev/qualifications" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDevToken } from "@/lib/api/devAuth";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Role } from "@/lib/rbac";

/**
 * GET /api/dev/qualifications
 * Lists qualifications for development/testing purposes.
 * 
 * Security:
 * - Returns 404 in production (endpoint doesn't exist)
 * - Requires valid X-DEV-TOKEN header in development
 * - Only accessible to PLATFORM_ADMIN role (via dev token)
 * 
 * Returns:
 * {
 *   "count": number,
 *   "items": [
 *     {
 *       "qualification_id": string,
 *       "name": string,
 *       "code": string | null
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Return 404 in production (endpoint doesn't exist)
    if (process.env.NODE_ENV !== "development") {
      return new Response(null, { status: 404 });
    }

    // Require dev token authentication (no NextAuth fallback)
    const ctx = await requireDevToken(request);

    // Restrict to PLATFORM_ADMIN
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
    const limit = Math.min(
      limitParam ? parseInt(limitParam, 10) : 50,
      100 // Cap at 100
    );

    if (isNaN(limit) || limit < 1) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid limit parameter (must be a positive number)",
        400
      );
    }

    // Build where clause
    const where: any = {
      deleted_at: null, // Only non-deleted qualifications
    };

    // Add search filter if provided
    if (searchQuery.trim()) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { code: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Query qualifications
    const qualifications = await prisma.qualification.findMany({
      where,
      select: {
        qualification_id: true,
        name: true,
        code: true,
      },
      orderBy: {
        created_at: "desc", // Newest first
      },
      take: limit,
    });

    return ok({
      count: qualifications.length,
      items: qualifications,
    });
  } catch (error) {
    // Handle 404 for production (endpoint doesn't exist)
    if (process.env.NODE_ENV !== "development") {
      return new Response(null, { status: 404 });
    }

    return fail(error);
  }
}

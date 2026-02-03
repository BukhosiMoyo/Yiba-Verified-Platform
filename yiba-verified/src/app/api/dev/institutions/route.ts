// GET /api/dev/institutions - Dev-only endpoint to list institutions
// ONLY available in development mode (NODE_ENV === "development")
// Requires X-DEV-TOKEN header for authentication
//
// Query params:
//   ?q=searchText - Search in legal_name, trading_name, or registration_number
//   ?limit=number - Limit results (default: 50, max: 100)
//
// Example:
//   curl -sS https://yibaverified.co.za/api/dev/institutions \
//     -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" | jq

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDevToken } from "@/lib/api/devAuth";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Role } from "@/lib/rbac";

/**
 * GET /api/dev/institutions
 * Lists institutions for development/testing purposes.
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
 *       "institution_id": string,
 *       "legal_name": string,
 *       "trading_name": string | null,
 *       "province": string,
 *       "registration_number": string
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

    // Optional: Restrict to PLATFORM_ADMIN (preferred)
    // For simplicity, allow any dev-token user, but prefer PLATFORM_ADMIN check
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

    // Query institutions
    // Note: If created_at doesn't exist, this will fail - adjust schema or remove orderBy
    const institutions = await prisma.institution.findMany({
      where,
      select: {
        institution_id: true,
        legal_name: true,
        trading_name: true,
        province: true,
        registration_number: true,
      },
      orderBy: {
        created_at: "desc", // Newest first (assumes created_at field exists)
      },
      take: limit,
    });

    return ok({
      count: institutions.length,
      items: institutions,
    });
  } catch (error) {
    // Handle 404 for production (endpoint doesn't exist)
    if (process.env.NODE_ENV !== "development") {
      return new Response(null, { status: 404 });
    }

    return fail(error);
  }
}

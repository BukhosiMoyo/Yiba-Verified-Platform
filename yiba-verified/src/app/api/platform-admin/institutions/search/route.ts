// GET /api/platform-admin/institutions/search - Search institutions with admin info (PLATFORM_ADMIN only)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/platform-admin/institutions/search
 * Searches institutions with admin information (PLATFORM_ADMIN only).
 * 
 * RBAC: Only PLATFORM_ADMIN can access this endpoint.
 * 
 * Query params:
 *   ?q=searchText - Search in legal_name, trading_name, or registration_number
 *   ?limit=number - Limit results (default: 20, max: 50)
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
 *       "registration_number": string,
 *       "current_admin": {
 *         "user_id": string,
 *         "first_name": string,
 *         "last_name": string,
 *         "email": string
 *       } | null
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // RBAC: Only PLATFORM_ADMIN
    const ctx = await requireRole(request, "PLATFORM_ADMIN");

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";
    const limitParam = searchParams.get("limit");
    const limit = Math.min(
      limitParam ? parseInt(limitParam, 10) : 20,
      50 // Cap at 50
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

    // Query institutions with their current admin
    const institutions = await prisma.institution.findMany({
      where,
      select: {
        institution_id: true,
        legal_name: true,
        trading_name: true,
        province: true,
        registration_number: true,
        users: {
          where: {
            role: "INSTITUTION_ADMIN",
            deleted_at: null,
            status: "ACTIVE",
          },
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
          take: 1, // Just get the first admin
        },
      },
      orderBy: {
        legal_name: "asc",
      },
      take: limit,
    });

    // Transform to include current_admin
    const items = institutions.map((inst) => ({
      institution_id: inst.institution_id,
      legal_name: inst.legal_name,
      trading_name: inst.trading_name,
      province: inst.province,
      registration_number: inst.registration_number,
      current_admin: inst.users.length > 0 ? inst.users[0] : null,
    }));

    return ok({
      count: items.length,
      items,
    });
  } catch (error) {
    return fail(error);
  }
}

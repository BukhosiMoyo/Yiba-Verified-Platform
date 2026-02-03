// GET /api/institutions/requests - List QCTO requests for an institution
//
// GET Test commands:
//   # With dev token (development only):
//   export BASE_URL="https://yibaverified.co.za"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -sS "$BASE_URL/api/institutions/requests?status=PENDING&limit=20" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/institutions/requests
 * Lists QCTO requests for an institution.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be INSTITUTION_ADMIN, INSTITUTION_STAFF, or PLATFORM_ADMIN
 * - NextAuth session:
 *   - INSTITUTION_ADMIN / INSTITUTION_STAFF: can list requests for their own institution
 *   - PLATFORM_ADMIN: can list ALL requests (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Query parameters:
 * - status (optional - filter by status: PENDING, APPROVED, REJECTED)
 * - institution_id (optional - filter by institution; PLATFORM_ADMIN only)
 * - limit (optional, default 50, max 200)
 * 
 * Returns:
 * {
 *   "count": number,
 *   "items": [ ...qctoRequests... ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);

    // Only INSTITUTION_* roles and PLATFORM_ADMIN can list requests
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot list QCTO requests`,
        403
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const institutionIdParam = searchParams.get("institution_id");
    const statusParam = searchParams.get("status") as "PENDING" | "APPROVED" | "REJECTED" | null;
    const limitParam = searchParams.get("limit");
    const limit = Math.min(
      limitParam ? parseInt(limitParam, 10) : 50,
      200 // Cap at 200
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
      deleted_at: null, // Only non-deleted requests
    };

    // INSTITUTION_* roles: Only see requests for their institution
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Institution users must belong to an institution",
          403
        );
      }
      where.institution_id = ctx.institutionId;
    } else if (ctx.role === "PLATFORM_ADMIN" && institutionIdParam) {
      // PLATFORM_ADMIN can filter by institution if provided
      where.institution_id = institutionIdParam;
    }
    // PLATFORM_ADMIN can omit institution_id to see all (app owners see everything! 🦸)

    // Filter by status if provided
    if (statusParam) {
      const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
      if (!validStatuses.includes(statusParam)) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Invalid status parameter (must be one of: ${validStatuses.join(", ")})`,
          400
        );
      }
      where.status = statusParam;
    }

    // Fetch requests
    const [requests, totalCount] = await Promise.all([
      prisma.qCTORequest.findMany({
        where,
        include: {
          institution: {
            select: {
              institution_id: true,
              legal_name: true,
              trading_name: true,
              registration_number: true,
            },
          },
          requestedByUser: {
            select: {
              user_id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          reviewedByUser: {
            select: {
              user_id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          requestResources: {
            select: {
              resource_id: true,
              resource_type: true,
              resource_id_value: true,
              added_at: true,
              notes: true,
            },
          },
        },
        orderBy: {
          requested_at: "desc",
        },
        take: limit,
      }),
      prisma.qCTORequest.count({ where }),
    ]);

    // Add debug header in development
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }

    return NextResponse.json(
      {
        count: totalCount,
        items: requests,
      },
      { status: 200, headers }
    );
  } catch (error) {
    return fail(error);
  }
}

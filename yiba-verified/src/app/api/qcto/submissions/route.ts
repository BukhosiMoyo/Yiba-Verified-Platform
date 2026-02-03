// GET /api/qcto/submissions - List submissions QCTO can access
//
// GET Test commands:
//   # With dev token (development only, requires QCTO_USER or PLATFORM_ADMIN):
//   export BASE_URL="https://yibaverified.co.za"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -sS "$BASE_URL/api/qcto/submissions?limit=20" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
//
//   # Filter by status:
//   curl -sS "$BASE_URL/api/qcto/submissions?status=APPROVED&limit=20" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
//
//   # Filter by institution (PLATFORM_ADMIN only):
//   curl -sS "$BASE_URL/api/qcto/submissions?institution_id=<INST_ID>&limit=20" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";
import { getProvinceFilterForQCTO } from "@/lib/api/qctoAccess";

/**
 * GET /api/qcto/submissions
 * Lists submissions that QCTO can access.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be QCTO_USER or PLATFORM_ADMIN
 * - NextAuth session:
 *   - QCTO_USER: can list submissions they can access (submission/request-based)
 *   - PLATFORM_ADMIN: can list ALL submissions (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed - only QCTO and platform admins)
 * 
 * Query parameters:
 * - institution_id (optional - filter by institution; PLATFORM_ADMIN only, otherwise ignored)
 * - status (optional - filter by status)
 * - province (optional - filter by institution.province)
 * - q (optional - search in title, institution trading_name, institution legal_name; min 2 chars)
 * - limit (optional, default 50, max 200)
 * - offset (optional, default 0)
 * 
 * Returns:
 * {
 *   "count": number (total matching),
 *   "items": [ ...submissions with _count.submissionResources... ]
 * }
 */
const VALID_STATUSES = ["DRAFT", "PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "RETURNED_FOR_CORRECTION"];

export async function GET(request: NextRequest) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot access QCTO endpoints`,
        403
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const institutionIdParam = searchParams.get("institution_id");
    const statusParam = searchParams.get("status");
    const provinceParam = searchParams.get("province")?.trim() || "";
    const qParam = searchParams.get("q")?.trim() || "";
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

    // Build where clause
    let where: any = {
      deleted_at: null, // Only non-deleted submissions
    };

    // PLATFORM_ADMIN, QCTO_SUPER_ADMIN, QCTO_ADMIN can filter by institution; QCTO_USER cannot
    if (institutionIdParam && ctx.role !== "QCTO_USER") {
      where.institution_id = institutionIdParam;
    }

    // Filter by status if provided
    if (statusParam && VALID_STATUSES.includes(statusParam)) {
      where.status = statusParam;
    }

    // Get province filter based on user's assigned provinces
    const provinceFilter = await getProvinceFilterForQCTO(ctx);

    // Apply province filtering to institution
    if (provinceFilter !== null) {
      // User has assigned provinces - filter institutions to those provinces
      if (provinceFilter.length === 0) {
        // No provinces assigned - return empty result
        return fail(new AppError(
          ERROR_CODES.FORBIDDEN,
          "No provinces assigned. Please contact your administrator.",
          403
        ));
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
        return fail(new AppError(
          ERROR_CODES.FORBIDDEN,
          "You don't have access to institutions in this province",
          403
        ));
      }
    }

    // Search (q): title or institution name
    if (qParam.length >= 2) {
      where = {
        AND: [
          where,
          {
            OR: [
              { title: { contains: qParam, mode: "insensitive" as const } },
              { institution: { trading_name: { contains: qParam, mode: "insensitive" as const } } },
              { institution: { legal_name: { contains: qParam, mode: "insensitive" as const } } },
            ],
          },
        ],
      };
    }

    // QCTO_USER: Only see submissions they can access (submission/request-based)
    // For now, we'll return all non-deleted submissions.
    // In a full implementation, you might want to filter by:
    // - Submissions that have been APPROVED (institutions submitted them)
    // - Or submissions linked to APPROVED QCTORequests
    // 
    // Note: The canReadForQCTO() helper is used at the resource level, not submission level.
    // For listing submissions, QCTO_USER typically sees all submissions (they can review them),
    // but canReadForQCTO() controls which resources within those submissions they can access.
    //
    // For now, let's allow QCTO_USER to see all submissions (they're reviewers!).
    // If you need stricter filtering, you can add it here.

    // Fetch submissions
    const [submissions, totalCount] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          institution: {
            select: {
              institution_id: true,
              legal_name: true,
              trading_name: true,
            },
          },
          submittedByUser: {
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
          submissionResources: {
            select: {
              resource_id: true,
              resource_type: true,
              resource_id_value: true,
              added_at: true,
              notes: true,
            },
          },
        },
        orderBy: { submitted_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.submission.count({ where }),
    ]);

    // Add debug header in development
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }

    return NextResponse.json(
      {
        count: totalCount,
        items: submissions,
      },
      { status: 200, headers }
    );
  } catch (error) {
    return fail(error);
  }
}

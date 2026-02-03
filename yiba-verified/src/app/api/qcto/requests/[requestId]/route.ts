// GET /api/qcto/requests/[requestId] - View a single QCTO request
//
// GET Test commands:
//   # With dev token (development only):
//   export BASE_URL="https://yibaverified.co.za"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -sS "$BASE_URL/api/qcto/requests/<REQUEST_ID>" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";
import { validateRouteParamUUID } from "@/lib/security/validation";
import { applyRateLimit, RATE_LIMITS } from "@/lib/api/routeHelpers";

/**
 * GET /api/qcto/requests/[requestId]
 * Fetches a single QCTO request by ID.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be QCTO_USER or PLATFORM_ADMIN
 * - NextAuth session:
 *   - QCTO_USER: can view requests they created (requested_by = ctx.userId)
 *   - PLATFORM_ADMIN: can view any request (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Returns:
 * {
 *   ...qctoRequest with relations...
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
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

    // Apply rate limiting
    const rateLimitHeaders = applyRateLimit(request, RATE_LIMITS.STANDARD, ctx.userId);

    // Unwrap and validate params (Next.js 16)
    const { requestId: rawRequestId } = await params;
    const requestId = validateRouteParamUUID(rawRequestId, "requestId");

    // Build where clause with access control
    const where: any = {
      request_id: requestId,
      deleted_at: null, // Only non-deleted
    };

    // QCTO_USER: Only see requests they created
    if (ctx.role === "QCTO_USER") {
      where.requested_by = ctx.userId;
    }

    // Note: Verify the Prisma client model name after migration
    // It might be qCTORequest or qctoRequest
    const qctoRequest = await prisma.qCTORequest.findFirst({
      where,
      include: {
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
            registration_number: true,
            institution_type: true,
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
    });

    if (!qctoRequest) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `QCTO request not found: ${requestId}`,
        404
      );
    }

    // Add debug header in development
    const headers: Record<string, string> = { ...rateLimitHeaders };
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }

    return NextResponse.json(qctoRequest, { status: 200, headers });
  } catch (error) {
    return fail(error);
  }
}

// GET /api/qcto/requests - List QCTO requests
// POST /api/qcto/requests - Create a new QCTO request
//
// GET Test commands:
//   # With dev token (development only):
//   export BASE_URL="https://yibaverified.co.za"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -sS "$BASE_URL/api/qcto/requests?limit=20" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
//
//   # Filter by status:
//   curl -sS "$BASE_URL/api/qcto/requests?status=APPROVED&limit=20" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
//
// POST Test commands:
//   curl -X POST "$BASE_URL/api/qcto/requests" \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
//     -d '{
//       "institution_id": "<INSTITUTION_ID>",
//       "request_type": "READINESS_REVIEW",
//       "title": "Request for Readiness Review",
//       "description": "We need to review the readiness assessment",
//       "resource_type": "READINESS",
//       "resource_id_value": "<READINESS_ID>"
//     }'

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData, QCTO_DATA_ACCESS_ROLES } from "@/lib/rbac";
import { getProvinceFilterForQCTO } from "@/lib/api/qctoAccess";

type CreateQCTORequestBody = {
  institution_id: string;
  request_type?: string; // e.g., "READINESS_REVIEW", "COMPLIANCE_CHECK", "DATA_EXPORT"
  title: string;
  description?: string;
  expires_at?: string; // ISO date string
  response_deadline?: string; // ISO date string - institution should respond by this date
  // Optional: Add resources immediately
  resources?: Array<{
    resource_type: "READINESS" | "LEARNER" | "ENROLMENT" | "DOCUMENT" | "INSTITUTION" | "FACILITATOR";
    resource_id_value: string;
    notes?: string;
    // For DOCUMENT resources: optional profile linking
    link_to_profile?: {
      entity_type: "FACILITATOR" | "LEARNER" | "READINESS" | "INSTITUTION";
      entity_id: string;
    };
  }>;
};

/**
 * POST /api/qcto/requests
 * Creates a new QCTO request to an institution.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be QCTO_USER or PLATFORM_ADMIN
 * - NextAuth session:
 *   - QCTO_USER: can create requests (they're the requesters!)
 *   - PLATFORM_ADMIN: can create requests (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Validations:
 * - Institution must exist and not be deleted
 * - Title is required
 * - Resources (if provided) must be valid resource types
 * 
 * Returns:
 * {
 *   ...qctoRequest with relations...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot create QCTO requests`,
        403
      );
    }

    // Parse and validate request body
    const body: CreateQCTORequestBody = await request.json();

    if (!body.institution_id) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing required field: institution_id",
        400
      );
    }

    if (!body.title || body.title.trim().length === 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing required field: title",
        400
      );
    }

    // Validate institution exists
    const institution = await prisma.institution.findUnique({
      where: {
        institution_id: body.institution_id,
        deleted_at: null,
      },
      select: {
        institution_id: true,
      },
    });

    if (!institution) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `Institution not found: ${body.institution_id}`,
        404
      );
    }

    // Validate resources if provided
    if (body.resources) {
      const validResourceTypes = ["READINESS", "LEARNER", "ENROLMENT", "DOCUMENT", "INSTITUTION", "FACILITATOR"];
      for (const resource of body.resources) {
        if (!validResourceTypes.includes(resource.resource_type)) {
          throw new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            `Invalid resource_type: ${resource.resource_type} (must be one of: ${validResourceTypes.join(", ")})`,
            400
          );
        }
        if (!resource.resource_id_value || resource.resource_id_value.trim().length === 0) {
          throw new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            "Each resource must have a resource_id_value",
            400
          );
        }
      }
    }

    const expiresAt = body.expires_at ? new Date(body.expires_at) : null;

    // Optional response_deadline: institution should respond by this date (must be future if provided)
    let responseDeadline: Date | null = null;
    if (body.response_deadline) {
      const parsed = new Date(body.response_deadline);
      if (isNaN(parsed.getTime())) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Invalid response_deadline date format (use ISO date string)",
          400
        );
      }
      if (parsed <= new Date()) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "response_deadline must be a future date",
          400
        );
      }
      responseDeadline = parsed;
    }

    // Execute mutation with full RBAC and audit enforcement
    const qctoRequest = await mutateWithAudit({
      entityType: "QCTO_REQUEST",
      changeType: "CREATE",
      fieldName: "request_id",
      oldValue: null,
      institutionId: body.institution_id,
      reason: `Create QCTO request: ${body.title}`,

      assertCan: async (tx, ctx) => {
        if (!QCTO_DATA_ACCESS_ROLES.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot create QCTO requests`,
            403
          );
        }
      },

      // Mutation: Create QCTO request with resources (if provided)
      mutation: async (tx, ctx) => {
        // Note: Verify the Prisma client model name after migration
        // It might be qCTORequest or qctoRequest
        const created = await tx.qCTORequest.create({
          data: {
            institution_id: body.institution_id,
            requested_by: ctx.userId,
            request_type: body.request_type || null,
            title: body.title,
            description: body.description || null,
            status: "PENDING", // Always starts as PENDING
            expires_at: expiresAt,
            response_deadline: responseDeadline,
            requestResources: body.resources
              ? {
                create: body.resources.map((r) => {
                  // Store link_to_profile in notes as JSON if provided
                  let notesValue = r.notes || null;
                  if (r.link_to_profile) {
                    const linkInfo = JSON.stringify({
                      link_to_profile: r.link_to_profile,
                      original_notes: r.notes || null,
                    });
                    notesValue = linkInfo;
                  }
                  return {
                    resource_type: r.resource_type,
                    resource_id_value: r.resource_id_value,
                    notes: notesValue,
                  };
                }),
              }
              : undefined,
          },
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

        return created;
      },
    });

    // Add debug header in development
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }

    return NextResponse.json(qctoRequest, {
      status: 201,
      headers,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * GET /api/qcto/requests
 * Lists QCTO requests.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be QCTO_USER or PLATFORM_ADMIN
 * - NextAuth session:
 *   - QCTO_USER: can list requests they created (filter by requested_by = ctx.userId)
 *   - PLATFORM_ADMIN: can list ALL requests (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Query parameters:
 * - institution_id (optional - filter by institution; PLATFORM_ADMIN only)
 * - status (optional - filter by status: PENDING, APPROVED, REJECTED)
 * - q (optional - search in title, institution legal_name, trading_name, registration_number; min 2 chars)
 * - limit (optional, default 50, max 200)
 * - offset (optional, default 0) - for pagination
 * 
 * Returns:
 * {
 *   "count": number,
 *   "items": [ ...qctoRequests... ],
 *   "meta": { "isYourRequestsOnly": boolean }
 * }
 */
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
    const statusParam = searchParams.get("status") as "PENDING" | "APPROVED" | "REJECTED" | null;
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

    // Get province filter based on user's assigned provinces
    const provinceFilter = await getProvinceFilterForQCTO(ctx);

    // Build where clause
    const where: any = {
      deleted_at: null, // Only non-deleted requests
    };

    // QCTO_USER: Only see requests they created
    if (ctx.role === "QCTO_USER") {
      where.requested_by = ctx.userId;
    }

    // Apply province filtering to requests (via institution)
    if (provinceFilter !== null && provinceFilter.length > 0) {
      where.institution = {
        ...where.institution,
        province: { in: provinceFilter },
      };
    } else if (provinceFilter !== null && provinceFilter.length === 0) {
      // No provinces assigned - return empty result
      return NextResponse.json(
        {
          count: 0,
          items: [],
          meta: { isYourRequestsOnly: (ctx.role as string) === "QCTO_USER" },
        },
        { status: 200 }
      );
    }

    // PLATFORM_ADMIN, QCTO_SUPER_ADMIN, QCTO_ADMIN: Can filter by institution if provided
    if (institutionIdParam && ctx.role !== "QCTO_USER") {
      // Verify institution is in user's province filter (if applicable)
      if (provinceFilter !== null && provinceFilter.length > 0) {
        const institution = await prisma.institution.findUnique({
          where: { institution_id: institutionIdParam },
          select: { province: true },
        });
        if (!institution || !provinceFilter.includes(institution.province)) {
          // Institution not in user's provinces - return empty
          return NextResponse.json(
            {
              count: 0,
              items: [],
              meta: { isYourRequestsOnly: (ctx.role as string) === "QCTO_USER" },
            },
            { status: 200 }
          );
        }
      }
      where.institution_id = institutionIdParam;
    }

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

    // Search: q (min 2 chars) in title or institution fields
    if (qParam.length >= 2) {
      where.AND = [
        {
          OR: [
            { title: { contains: qParam, mode: "insensitive" } },
            { institution: { legal_name: { contains: qParam, mode: "insensitive" } } },
            { institution: { trading_name: { contains: qParam, mode: "insensitive" } } },
            { institution: { registration_number: { contains: qParam, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const [requests, totalCount] = await Promise.all([
      prisma.qCTORequest.findMany({
        where,
        select: {
          request_id: true,
          institution_id: true,
          title: true,
          request_type: true,
          status: true,
          requested_at: true,
          response_deadline: true,
          reviewed_at: true,
          expires_at: true,
          institution: {
            select: {
              institution_id: true,
              legal_name: true,
              trading_name: true,
              registration_number: true,
            },
          },
          _count: { select: { requestResources: true } },
        },
        orderBy: { requested_at: "desc" },
        skip: offset,
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
        meta: { isYourRequestsOnly: (ctx.role as string) === "QCTO_USER" },
      },
      { status: 200, headers }
    );
  } catch (error) {
    return fail(error);
  }
}

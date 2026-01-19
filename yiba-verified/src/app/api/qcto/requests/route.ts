// GET /api/qcto/requests - List QCTO requests
// POST /api/qcto/requests - Create a new QCTO request
//
// GET Test commands:
//   # With dev token (development only):
//   export BASE_URL="http://localhost:3001"
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
import type { Role } from "@/lib/rbac";

type CreateQCTORequestBody = {
  institution_id: string;
  request_type?: string; // e.g., "READINESS_REVIEW", "COMPLIANCE_CHECK", "DATA_EXPORT"
  title: string;
  description?: string;
  expires_at?: string; // ISO date string
  // Optional: Add resources immediately
  resources?: Array<{
    resource_type: "READINESS" | "LEARNER" | "ENROLMENT" | "DOCUMENT" | "INSTITUTION";
    resource_id_value: string;
    notes?: string;
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
    
    // Only QCTO_USER and PLATFORM_ADMIN can create QCTO requests
    if (ctx.role !== "QCTO_USER" && ctx.role !== "PLATFORM_ADMIN") {
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
      const validResourceTypes = ["READINESS", "LEARNER", "ENROLMENT", "DOCUMENT", "INSTITUTION"];
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

    // Execute mutation with full RBAC and audit enforcement
    const qctoRequest = await mutateWithAudit({
      entityType: "QCTO_REQUEST",
      changeType: "CREATE",
      fieldName: "request_id",
      oldValue: null,
      institutionId: body.institution_id,
      reason: `Create QCTO request: ${body.title}`,
      
      // RBAC: Only QCTO_USER and PLATFORM_ADMIN can create QCTO requests
      assertCan: async (tx, ctx) => {
        const allowedRoles: Role[] = ["QCTO_USER", "PLATFORM_ADMIN"];
        if (!allowedRoles.includes(ctx.role)) {
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
            requestResources: body.resources
              ? {
                  create: body.resources.map((r) => ({
                    resource_type: r.resource_type,
                    resource_id_value: r.resource_id_value,
                    notes: r.notes || null,
                  })),
                }
              : undefined,
          },
          include: {
            institution: {
              select: {
                institution_id: true,
                name: true,
                code: true,
              },
            },
            requestedByUser: {
              select: {
                user_id: true,
                email: true,
                name: true,
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
    
    // Only QCTO_USER and PLATFORM_ADMIN can access QCTO endpoints
    if (ctx.role !== "QCTO_USER" && ctx.role !== "PLATFORM_ADMIN") {
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

    // QCTO_USER: Only see requests they created
    if (ctx.role === "QCTO_USER") {
      where.requested_by = ctx.userId;
    }

    // PLATFORM_ADMIN: Can filter by institution if provided
    if (ctx.role === "PLATFORM_ADMIN" && institutionIdParam) {
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

    // Note: Verify the Prisma client model name after migration
    // It might be qCTORequest or qctoRequest
    const [requests, totalCount] = await Promise.all([
      prisma.qCTORequest.findMany({
        where,
        include: {
          institution: {
            select: {
              institution_id: true,
              name: true,
              code: true,
            },
          },
          requestedByUser: {
            select: {
              user_id: true,
              email: true,
              name: true,
            },
          },
          reviewedByUser: {
            select: {
              user_id: true,
              email: true,
              name: true,
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

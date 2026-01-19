// PATCH /api/institutions/requests/[requestId] - Approve or reject a QCTO request
//
// PATCH Test commands:
//   # With dev token (development only):
//   export BASE_URL="http://localhost:3000"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -X PATCH "$BASE_URL/api/institutions/requests/<REQUEST_ID>" \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
//     -d '{
//       "status": "APPROVED",
//       "response_notes": "Request approved. Access granted."
//     }'
//
//   # Reject request:
//   curl -X PATCH "$BASE_URL/api/institutions/requests/<REQUEST_ID>" \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
//     -d '{
//       "status": "REJECTED",
//       "response_notes": "Request rejected. Reason: ..."
//     }'

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Role } from "@/lib/rbac";

type UpdateRequestBody = {
  status: "APPROVED" | "REJECTED";
  response_notes?: string;
  reason?: string; // For audit log
};

/**
 * PATCH /api/institutions/requests/[requestId]
 * Approves or rejects a QCTO request.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be INSTITUTION_ADMIN, INSTITUTION_STAFF, or PLATFORM_ADMIN
 * - NextAuth session:
 *   - INSTITUTION_ADMIN / INSTITUTION_STAFF: can approve/reject requests for their own institution
 *   - PLATFORM_ADMIN: can approve/reject any request (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Validations:
 * - Request must exist and not be deleted
 * - Request must belong to the institution (for INSTITUTION_* roles)
 * - Request status must be PENDING (cannot approve/reject already reviewed requests)
 * - Status must be APPROVED or REJECTED
 * 
 * Updates:
 * - status: APPROVED or REJECTED
 * - reviewed_at: current timestamp
 * - reviewed_by: current user ID
 * - response_notes: optional notes from institution
 * 
 * Returns:
 * {
 *   ...updated qctoRequest with relations...
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);
    
    // Only INSTITUTION_* roles and PLATFORM_ADMIN can approve/reject requests
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot approve/reject QCTO requests`,
        403
      );
    }

    // Unwrap params (Next.js 16)
    const { requestId } = await params;

    // Parse and validate request body
    const body: UpdateRequestBody = await request.json();
    
    if (!body.status) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing required field: status",
        400
      );
    }

    if (body.status !== "APPROVED" && body.status !== "REJECTED") {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Invalid status: ${body.status} (must be APPROVED or REJECTED)`,
        400
      );
    }

    // Fetch request to validate it exists and check institution scoping
    const qctoRequest = await prisma.qCTORequest.findUnique({
      where: {
        request_id: requestId,
        deleted_at: null,
      },
      select: {
        request_id: true,
        institution_id: true,
        status: true,
        title: true,
      },
    });

    if (!qctoRequest) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `QCTO request not found: ${requestId}`,
        404
      );
    }

    // Check if request is already reviewed
    if (qctoRequest.status !== "PENDING") {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Cannot update request: Request is already ${qctoRequest.status} (only PENDING requests can be approved/rejected)`,
        400
      );
    }

    // Enforce institution scoping (INSTITUTION_* roles can only approve requests for their institution)
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Institution users must belong to an institution",
          403
        );
      }

      if (ctx.institutionId !== qctoRequest.institution_id) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Cannot approve/reject requests from other institutions",
          403
        );
      }
    }
    // PLATFORM_ADMIN can approve/reject any request (app owners see everything! 🦸)

    // Execute mutation with full RBAC and audit enforcement
    const updatedRequest = await mutateWithAudit({
      entityType: "QCTO_REQUEST",
      changeType: "UPDATE",
      fieldName: "status",
      oldValue: qctoRequest.status,
      newValue: body.status,
      institutionId: qctoRequest.institution_id,
      reason: body.reason ?? `Approve/reject QCTO request: ${qctoRequest.title}`,
      
      // RBAC: Only INSTITUTION_* roles and PLATFORM_ADMIN can approve/reject
      assertCan: async (tx, ctx) => {
        const allowedRoles: Role[] = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
        if (!allowedRoles.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot approve/reject QCTO requests`,
            403
          );
        }

        // Double-check institution scoping
        if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
          if (!ctx.institutionId || ctx.institutionId !== qctoRequest.institution_id) {
            throw new AppError(
              ERROR_CODES.FORBIDDEN,
              "Cannot approve/reject requests from other institutions",
              403
            );
          }
        }
      },
      
      // Mutation: Update request status and review fields
      mutation: async (tx, ctx) => {
        const updated = await tx.qCTORequest.update({
          where: {
            request_id: requestId,
          },
          data: {
            status: body.status,
            reviewed_at: new Date(),
            reviewed_by: ctx.userId,
            response_notes: body.response_notes || null,
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
        });
        
        return updated;
      },
    });
    
    // Add debug header in development
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }
    
    return NextResponse.json(updatedRequest, { 
      status: 200,
      headers,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * GET /api/institutions/requests/[requestId]
 * Fetches a single QCTO request for an institution.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be INSTITUTION_ADMIN, INSTITUTION_STAFF, or PLATFORM_ADMIN
 * - NextAuth session:
 *   - INSTITUTION_ADMIN / INSTITUTION_STAFF: can view requests for their own institution
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
    
    // Only INSTITUTION_* roles and PLATFORM_ADMIN can view requests
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot view QCTO requests`,
        403
      );
    }

    // Unwrap params (Next.js 16)
    const { requestId } = await params;

    // Build where clause with access control
    const where: any = {
      request_id: requestId,
      deleted_at: null, // Only non-deleted
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
    }
    // PLATFORM_ADMIN: can view any request (no filter - app owners see everything! 🦸)

    // Fetch request from database
    const qctoRequest = await prisma.qCTORequest.findFirst({
      where,
      include: {
        institution: {
          select: {
            institution_id: true,
            name: true,
            code: true,
            type: true,
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
    });

    if (!qctoRequest) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `QCTO request not found: ${requestId}`,
        404
      );
    }

    // Add debug header in development
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }

    return NextResponse.json(qctoRequest, { status: 200, headers });
  } catch (error) {
    return fail(error);
  }
}

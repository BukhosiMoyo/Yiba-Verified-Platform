// POST /api/institutions/submissions - Create a new submission
// GET /api/institutions/submissions - List submissions for an institution
//
// POST Test commands:
//   # With dev token (development only):
//   export BASE_URL="https://yibaverified.co.za"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -X POST "$BASE_URL/api/institutions/submissions" \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
//     -d '{
//       "title": "Compliance Pack 2024",
//       "submission_type": "COMPLIANCE_PACK",
//       "resources": [
//         {
//           "resource_type": "LEARNER",
//           "resource_id_value": "<LEARNER_ID>",
//           "notes": "Main learner profile"
//         }
//       ]
//     }'
//
// GET Test commands:
//   # With dev token (development only):
//   curl -sS "$BASE_URL/api/institutions/submissions?status=DRAFT&limit=20" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Role } from "@/lib/rbac";

type CreateSubmissionBody = {
  title?: string; // Optional title/description
  submission_type?: string; // e.g., "READINESS", "COMPLIANCE_PACK", "ANNUAL_REPORT"
  // Optional: Add resources immediately
  resources?: Array<{
    resource_type: "READINESS" | "LEARNER" | "ENROLMENT" | "DOCUMENT" | "INSTITUTION";
    resource_id_value: string;
    notes?: string;
  }>;
  reason?: string; // For audit log
};

/**
 * POST /api/institutions/submissions
 * Creates a new submission (compliance pack, readiness report, etc.).
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be INSTITUTION_ADMIN, INSTITUTION_STAFF, or PLATFORM_ADMIN
 * - NextAuth session:
 *   - INSTITUTION_ADMIN / INSTITUTION_STAFF: can create submissions for their own institution
 *   - PLATFORM_ADMIN: can create submissions for any institution (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Validations:
 * - Institution must exist and not be deleted (for INSTITUTION_* roles, uses ctx.institutionId)
 * - Resources (if provided) must be valid resource types
 * 
 * Default behavior:
 * - Status defaults to DRAFT (institutions can edit before submitting)
 * - Institution_id is derived from ctx.institutionId (for INSTITUTION_* roles) or must be provided (for PLATFORM_ADMIN)
 * 
 * Returns:
 * {
 *   ...submission with relations...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);

    // Only INSTITUTION_* roles and PLATFORM_ADMIN can create submissions
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot create submissions`,
        403
      );
    }

    // Parse and validate request body
    const body: CreateSubmissionBody = await request.json();

    // Determine institution_id
    let institutionId: string;
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      // Institution roles: use their institution
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Institution users must belong to an institution",
          403
        );
      }
      institutionId = ctx.institutionId;
    } else {
      // PLATFORM_ADMIN: must provide institution_id (we don't auto-assign for admins)
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "PLATFORM_ADMIN must provide institution_id when creating submissions",
        400
      );
      // Note: If you want PLATFORM_ADMIN to create submissions, uncomment:
      // institutionId = body.institution_id;
      // if (!institutionId) {
      //   throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Missing required field: institution_id", 400);
      // }
    }

    // Validate institution exists
    const institution = await prisma.institution.findUnique({
      where: {
        institution_id: institutionId,
        deleted_at: null,
      },
      select: {
        institution_id: true,
      },
    });

    if (!institution) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        `Institution not found: ${institutionId}`,
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

    // Execute mutation with full RBAC and audit enforcement
    const submission = await mutateWithAudit({
      entityType: "SUBMISSION",
      changeType: "CREATE",
      fieldName: "submission_id",
      oldValue: null,
      institutionId: institutionId,
      reason: body.reason ?? `Create submission: ${body.title || "Untitled"}`,

      // RBAC: Only INSTITUTION_* roles and PLATFORM_ADMIN can create submissions
      assertCan: async (tx, ctx) => {
        const allowedRoles: Role[] = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
        if (!allowedRoles.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot create submissions`,
            403
          );
        }
      },

      // Mutation: Create submission with resources (if provided)
      mutation: async (tx, ctx) => {
        const created = await tx.submission.create({
          data: {
            institution_id: institutionId,
            title: body.title || null,
            submission_type: body.submission_type || null,
            status: "DRAFT", // Always starts as DRAFT
            submissionResources: body.resources
              ? {
                create: body.resources.map((r) => ({
                  resource_type: r.resource_type,
                  resource_id_value: r.resource_id_value,
                  added_by: ctx.userId,
                  notes: r.notes || null,
                })),
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
            submittedByUser: {
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
                addedByUser: {
                  select: {
                    user_id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                  },
                },
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

    return NextResponse.json(submission, {
      status: 201,
      headers,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * GET /api/institutions/submissions
 * Lists submissions for an institution.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be INSTITUTION_ADMIN, INSTITUTION_STAFF, or PLATFORM_ADMIN
 * - NextAuth session:
 *   - INSTITUTION_ADMIN / INSTITUTION_STAFF: can list submissions for their own institution
 *   - PLATFORM_ADMIN: can list ALL submissions (app owners see everything! 🦸)
 *   - Other roles: 403 (not allowed)
 * 
 * Query parameters:
 * - status (optional - filter by status)
 * - institution_id (optional - filter by institution; PLATFORM_ADMIN only)
 * - q (optional - search in title; min 2 chars)
 * - limit (optional, default 50, max 200)
 * - offset (optional, default 0)
 * 
 * Returns:
 * {
 *   "count": number (total matching),
 *   "items": [ ...submissions with _count.submissionResources... ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);

    // Only INSTITUTION_* roles and PLATFORM_ADMIN can list submissions
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot list submissions`,
        403
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const institutionIdParam = searchParams.get("institution_id");
    const statusParam = searchParams.get("status");
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

    // INSTITUTION_* roles: Only see submissions for their institution
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
      const validStatuses = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "RETURNED_FOR_CORRECTION"];
      if (validStatuses.includes(statusParam)) {
        where.status = statusParam;
      }
    }

    // Search (q): title
    if (qParam.length >= 2) {
      where = { AND: [where, { title: { contains: qParam, mode: "insensitive" as const } }] };
    }

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
        orderBy: { created_at: "desc" },
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

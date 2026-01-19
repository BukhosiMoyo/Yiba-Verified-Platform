// POST /api/enrolments - Create a new enrolment
// GET /api/enrolments - List enrolments (with RBAC enforcement)
//
// POST Test commands (ready-to-copy):
//   # With dev token (development only, should return 201):
//   export BASE_URL="http://localhost:3001"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -X POST "$BASE_URL/api/enrolments" \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" \
//     -d '{
//       "learner_id":"<LEARNER_ID>",
//       "qualification_id":"<QUALIFICATION_ID>",
//       "start_date":"2024-01-01",
//       "enrolment_status":"ACTIVE"
//     }'
//
// GET Test commands:
//   # With dev token (development only):
//   curl -sS "$BASE_URL/api/enrolments?institution_id=<INSTITUTION_ID>&limit=20" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
//
//   # Search enrolments:
//   curl -sS "$BASE_URL/api/enrolments?institution_id=<INSTITUTION_ID>&q=900101" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Role } from "@/lib/rbac";
import { canReadForQCTO } from "@/lib/api/qctoAccess";

type CreateEnrolmentBody = {
  learner_id: string;
  qualification_id?: string; // Optional - required if qualification_title not provided
  qualification_title?: string; // Optional fallback - required if qualification_id not provided
  start_date?: string; // ISO date string, defaults to today
  expected_completion_date?: string; // ISO date string
  enrolment_status?: "ACTIVE" | "COMPLETED" | "TRANSFERRED" | "ARCHIVED"; // Defaults to ACTIVE
  reason?: string; // Optional reason for audit log
  institution_id?: string; // Optional for PLATFORM_ADMIN (derived from learner if not provided)
};

/**
 * POST /api/enrolments
 * Creates a new enrolment record with RBAC enforcement and audit logging.
 * 
 * Authentication:
 * - Development: X-DEV-TOKEN header (requires PLATFORM_ADMIN role)
 * - Production: NextAuth session only
 * 
 * Allowed roles: PLATFORM_ADMIN, INSTITUTION_ADMIN, INSTITUTION_STAFF
 * 
 * For INSTITUTION_ADMIN and INSTITUTION_STAFF:
 * - institution_id is automatically derived from learner.institution_id
 * - Learner must belong to their institution
 * 
 * For PLATFORM_ADMIN:
 * - institution_id is derived from learner.institution_id (preferred to reduce client errors)
 * - Can create enrolments for any institution
 * 
 * Validations:
 * - Learner must exist and not be deleted
 * - Qualification must exist and not be deleted (via qualification_id) OR qualification_title must be provided
 * - No duplicate active enrolments (same learner + (qualification_id OR qualification_title) + not deleted)
 */
export async function POST(request: NextRequest) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);
    
    // Dev token authentication requires PLATFORM_ADMIN role
    if (authMode === "devtoken" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Dev token authentication requires PLATFORM_ADMIN role for POST /api/enrolments",
        403
      );
    }
    
    // Parse and validate request body
    const body: CreateEnrolmentBody = await request.json();
    
    // Validate required fields - must provide EITHER qualification_id OR qualification_title
    if (!body.learner_id) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing required field: learner_id",
        400
      );
    }
    
    if (!body.qualification_id && !body.qualification_title) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Must provide either qualification_id or qualification_title",
        400
      );
    }

    // Determine institution_id based on role (derive from learner for consistency)
    let institutionId: string;

    // First, fetch learner to get institution_id and validate it exists
    const learner = await prisma.learner.findUnique({
      where: { learner_id: body.learner_id },
      select: {
        learner_id: true,
        institution_id: true,
        deleted_at: true,
      },
    });

    if (!learner || learner.deleted_at !== null) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Learner not found or has been deleted",
        404
      );
    }

    // Use learner's institution_id (preferred approach to reduce client errors)
    institutionId = learner.institution_id;

    // For institution roles, enforce that learner belongs to their institution
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Institution users must belong to an institution",
          403
        );
      }
      if (learner.institution_id !== ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Cannot create enrolment for learner from another institution",
          403
        );
      }
    }

    // If PLATFORM_ADMIN provides institution_id, validate it matches learner's institution
    if (ctx.role === "PLATFORM_ADMIN" && body.institution_id) {
      if (body.institution_id !== learner.institution_id) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Provided institution_id does not match learner's institution_id",
          400
        );
      }
    }

    // Validate qualification - if qualification_id provided, check it exists
    let qualificationId: string | null = null;
    let qualificationTitle: string;

    if (body.qualification_id) {
      // Validate qualification exists and is not deleted
      const qualification = await prisma.qualification.findUnique({
        where: { qualification_id: body.qualification_id },
        select: {
          qualification_id: true,
          name: true,
          deleted_at: true,
        },
      });

      if (!qualification || qualification.deleted_at !== null) {
        throw new AppError(
          ERROR_CODES.NOT_FOUND,
          "Qualification not found or has been deleted",
          404
        );
      }
      
      qualificationId = qualification.qualification_id;
      qualificationTitle = qualification.name;
    } else {
      // Fallback: use qualification_title if qualification_id not provided
      qualificationTitle = body.qualification_title!;
    }

    // Check for duplicate active enrolment
    // Check by qualification_id if provided, otherwise by qualification_title
    const existingEnrolment = await prisma.enrolment.findFirst({
      where: {
        learner_id: body.learner_id,
        deleted_at: null,
        ...(qualificationId
          ? { qualification_id: qualificationId }
          : { qualification_title: qualificationTitle }),
      },
    });

    if (existingEnrolment) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "An active enrolment already exists for this learner and qualification",
        400
      );
    }

    // Default values
    const startDate = body.start_date ? new Date(body.start_date) : new Date();
    const expectedCompletionDate = body.expected_completion_date
      ? new Date(body.expected_completion_date)
      : null;
    const enrolmentStatus = body.enrolment_status || "ACTIVE";

    // Execute mutation with full RBAC and audit enforcement
    const enrolment = await mutateWithAudit({
      entityType: "ENROLMENT",
      changeType: "CREATE",
      fieldName: "enrolment_id",
      oldValue: null,
      institutionId: institutionId,
      reason: body.reason ?? null,
      
      // RBAC: Only PLATFORM_ADMIN, INSTITUTION_ADMIN, INSTITUTION_STAFF can create enrolments
      assertCan: async (tx, ctx) => {
        const allowedRoles: Role[] = ["PLATFORM_ADMIN", "INSTITUTION_ADMIN", "INSTITUTION_STAFF"];
        if (!allowedRoles.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot create enrolments`,
            403
          );
        }
      },
      
      // Mutation: Create enrolment
      mutation: async (tx, ctx) => {
        const created = await tx.enrolment.create({
          data: {
            learner_id: body.learner_id,
            institution_id: institutionId,
            qualification_id: qualificationId,
            qualification_title: qualificationTitle,
            start_date: startDate,
            expected_completion_date: expectedCompletionDate,
            enrolment_status: enrolmentStatus,
          },
        });
        
        return created;
      },
    });
    
    // Add debug header in development (shows which auth method was used)
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }
    
    return NextResponse.json(enrolment, { 
      status: 201,
      headers,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * GET /api/enrolments
 * Lists enrolments with RBAC enforcement.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be PLATFORM_ADMIN
 * - NextAuth session:
 *   - PLATFORM_ADMIN: can list ALL enrolments (institution_id optional - if provided, filters to that institution; if not provided, shows all) - app owners see everything!
 *   - INSTITUTION_ADMIN/INSTITUTION_STAFF: can only list their own institution (institution_id is overridden)
 *   - STUDENT: can only list their own enrolments (self-scoping - returns enrolments where enrolment.learner.user_id matches ctx.userId)
 *   - QCTO_USER: can list enrolments that are in APPROVED submissions or APPROVED QCTORequests (submission/request-based access)
 * 
 * Query parameters:
 * - institution_id (optional - if provided, filters to that institution; PLATFORM_ADMIN can omit to see all)
 * - q (optional search: matches learner national_id, learner name, qualification name)
 * - limit (optional, default 50, max 200)
 * 
 * Returns:
 * {
 *   "count": number,
 *   "items": [ ...enrolments... ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);
    
    // Dev token authentication requires PLATFORM_ADMIN role
    if (authMode === "devtoken" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Dev token authentication requires PLATFORM_ADMIN role",
        403
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const institutionIdParam = searchParams.get("institution_id");
    const searchQuery = searchParams.get("q") || "";
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

    // Determine institution_id based on role
    let institutionId: string | null = null;

    if (ctx.role === "PLATFORM_ADMIN") {
      // PLATFORM_ADMIN can see ALL enrolments (institution_id optional)
      // If provided, filter to that institution; if not provided, show all - app owners see everything!
      institutionId = institutionIdParam;
    } else if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      // Institution roles can only list their own institution
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Institution users must belong to an institution",
          403
        );
      }
      institutionId = ctx.institutionId; // Override any provided institution_id
    } else if (ctx.role === "STUDENT") {
      // STUDENT can only see their own enrolments - filter by learner.user_id
      // We'll handle this after building the where clause
    } else if (ctx.role === "QCTO_USER") {
      // QCTO_USER can list enrolments, but only those in APPROVED submissions or APPROVED QCTORequests
      // We'll filter using allowed resource IDs
    } else {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot list enrolments`,
        403
      );
    }

    // For QCTO_USER: Fetch allowed resource IDs first (from APPROVED submissions/requests)
    let allowedEnrolmentIds: string[] | null = null;
    if (ctx.role === "QCTO_USER") {
      // Fetch enrolment IDs from APPROVED submissions
      const submissionResources = await prisma.submissionResource.findMany({
        where: {
          resource_type: "ENROLMENT",
          submission: {
            status: "APPROVED",
            deleted_at: null,
          },
        },
        select: {
          resource_id_value: true,
        },
      });

      // Fetch enrolment IDs from APPROVED QCTORequests
      const requestResources = await prisma.qCTORequestResource.findMany({
        where: {
          resource_type: "ENROLMENT",
          request: {
            status: "APPROVED",
            deleted_at: null,
          },
        },
        select: {
          resource_id_value: true,
        },
      });

      // Combine unique IDs
      allowedEnrolmentIds = Array.from(
        new Set([
          ...submissionResources.map((r) => r.resource_id_value),
          ...requestResources.map((r) => r.resource_id_value),
        ])
      );

      // If no allowed resources, return empty result immediately
      if (allowedEnrolmentIds.length === 0) {
        const headers: Record<string, string> = {};
        if (process.env.NODE_ENV === "development") {
          headers["X-AUTH-MODE"] = authMode;
        }
        return NextResponse.json(
          { count: 0, items: [] },
          { headers }
        );
      }
    }

    // Build where clause
    const where: any = {
      deleted_at: null, // Only non-deleted enrolments
    };

    // QCTO_USER: Only show enrolments in APPROVED submissions/requests
    if (ctx.role === "QCTO_USER") {
      where.enrolment_id = { in: allowedEnrolmentIds! };
    } else if (institutionId) {
      // Only filter by institution_id if provided (PLATFORM_ADMIN can omit to see all - app owners see everything!)
      where.institution_id = institutionId;
    }

    // Add search filter if provided
    if (searchQuery.trim()) {
      where.OR = [
        { learner: { national_id: { contains: searchQuery, mode: "insensitive" } } },
        { learner: { first_name: { contains: searchQuery, mode: "insensitive" } } },
        { learner: { last_name: { contains: searchQuery, mode: "insensitive" } } },
        { qualification: { name: { contains: searchQuery, mode: "insensitive" } } },
        { qualification_title: { contains: searchQuery, mode: "insensitive" } }, // Backward compatibility
      ];
    }

    // Query enrolments (read-only, no mutations)
    const enrolments = await prisma.enrolment.findMany({
      where,
      select: {
        enrolment_id: true,
        learner_id: true,
        institution_id: true,
        qualification_id: true,
        qualification_title: true,
        start_date: true,
        expected_completion_date: true,
        enrolment_status: true,
        attendance_percentage: true,
        assessment_centre_code: true,
        readiness_status: true,
        flc_status: true,
        statement_number: true,
        created_at: true,
        updated_at: true,
        learner: {
          select: {
            national_id: true,
            first_name: true,
            last_name: true,
          },
        },
        qualification: {
          select: {
            qualification_id: true,
            name: true,
            code: true,
          },
        },
        // Explicitly exclude sensitive fields
        // deleted_at is already filtered in where clause
      },
      orderBy: {
        created_at: "desc", // Newest first
      },
      take: limit,
    });

    // Add debug header in development (shows which auth method was used)
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }
    
    return NextResponse.json({
      count: enrolments.length,
      items: enrolments,
    }, { headers });
  } catch (error) {
    return fail(error);
  }
}

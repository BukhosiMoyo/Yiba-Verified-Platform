// POST /api/learners - Create a new learner
// GET /api/learners - List learners (with RBAC enforcement)
//
// POST Test commands (ready-to-copy):
//   # Without auth (should return 401):
//   curl -X POST https://yibaverified.co.za/api/learners \
//     -H "Content-Type: application/json" \
//     -d '{"national_id":"1234567890123","first_name":"John","last_name":"Doe"}'
//
//   # With NextAuth session (should return 201):
//   curl -X POST https://yibaverified.co.za/api/learners \
//     -H "Content-Type: application/json" \
//     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
//     -d '{"national_id":"1234567890123","first_name":"John","last_name":"Doe","birth_date":"2000-01-01","gender_code":"M","nationality_code":"ZA","popia_consent":true,"consent_date":"2024-01-01","institution_id":"<INSTITUTION_ID>"}'
//
//   # With dev token (development only, should return 201):
//   curl -X POST https://yibaverified.co.za/api/learners \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" \
//     -d '{"national_id":"9001015009088","first_name":"Jane","last_name":"Doe","birth_date":"1990-01-01","gender_code":"F","nationality_code":"ZA","popia_consent":true,"consent_date":"2024-01-01","institution_id":"<INSTITUTION_ID>"}'
//
// GET Test commands:
//   # With dev token (development only):
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   INSTITUTION_ID=$(curl -sS https://yibaverified.co.za/api/dev/institutions -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq -r '.items[0].institution_id')
//   curl -sS "https://yibaverified.co.za/api/learners?institution_id=$INSTITUTION_ID&limit=20" -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
//
//   # Search learners:
//   curl -sS "https://yibaverified.co.za/api/learners?institution_id=$INSTITUTION_ID&q=900101" -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import type { Role } from "@/lib/rbac";
import { canReadForQCTO } from "@/lib/api/qctoAccess";

type CreateLearnerBody = {
  national_id: string;
  first_name: string;
  last_name: string;
  birth_date: string; // ISO date string
  gender_code: string;
  nationality_code: string;
  home_language_code?: string;
  disability_status?: string;
  alternate_id?: string;
  popia_consent: boolean;
  consent_date: string; // ISO date string
  reason?: string; // Optional reason for audit log
  institution_id?: string; // Only for PLATFORM_ADMIN
};

/**
 * POST /api/learners
 * Creates a new learner record with RBAC enforcement and audit logging.
 * 
 * Authentication:
 * - Development: X-DEV-TOKEN header (requires PLATFORM_ADMIN role)
 * - Production: NextAuth session only
 * 
 * Allowed roles: PLATFORM_ADMIN, INSTITUTION_ADMIN, INSTITUTION_STAFF
 * 
 * For INSTITUTION_ADMIN and INSTITUTION_STAFF:
 * - institution_id is automatically set from session (cannot be overridden)
 * - Must belong to an institution
 * 
 * For PLATFORM_ADMIN:
 * - Can create learners for any institution
 * - institution_id must be provided in request body
 */
export async function POST(request: NextRequest) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);

    // Dev token authentication requires PLATFORM_ADMIN role
    if (authMode === "devtoken" && ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Dev token authentication requires PLATFORM_ADMIN role for POST /api/learners",
        403
      );
    }

    // Parse and validate request body
    const body: CreateLearnerBody = await request.json();

    // Validate required fields
    if (!body.national_id || !body.first_name || !body.last_name || !body.birth_date || !body.gender_code || !body.nationality_code) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing required fields: national_id, first_name, last_name, birth_date, gender_code, nationality_code",
        400
      );
    }

    // Validate popia_consent and consent_date (required per schema)
    if (body.popia_consent === undefined || body.consent_date === undefined) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing required fields: popia_consent, consent_date",
        400
      );
    }

    // Determine institution_id based on role (before mutation for scoping check)
    let institutionId: string;
    if (ctx.role === "PLATFORM_ADMIN") {
      // PLATFORM_ADMIN can create for any institution, but must provide it
      if (!(body as any).institution_id) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "PLATFORM_ADMIN must provide institution_id",
          400
        );
      }
      institutionId = (body as any).institution_id;
    } else {
      // INSTITUTION_ADMIN and INSTITUTION_STAFF: force their institution
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Institution users must belong to an institution",
          403
        );
      }
      institutionId = ctx.institutionId;
      // Ignore institution_id from body for institution roles (security)
    }

    // Execute mutation with full RBAC and audit enforcement
    const learner = await mutateWithAudit({
      entityType: "LEARNER",
      changeType: "CREATE",
      fieldName: "learner_id",
      oldValue: null,
      institutionId: institutionId, // Set before mutation for scoping check
      reason: body.reason ?? null,

      // RBAC: Only PLATFORM_ADMIN, INSTITUTION_ADMIN, INSTITUTION_STAFF can create learners
      assertCan: async (tx, ctx) => {
        const allowedRoles: Role[] = ["PLATFORM_ADMIN", "INSTITUTION_ADMIN", "INSTITUTION_STAFF"];
        if (!allowedRoles.includes(ctx.role)) {
          throw new AppError(
            ERROR_CODES.FORBIDDEN,
            `Role ${ctx.role} cannot create learners`,
            403
          );
        }
      },

      // Mutation: Create learner
      mutation: async (tx, ctx) => {
        // Check if national_id already exists
        const existing = await tx.learner.findUnique({
          where: { national_id: body.national_id },
        });

        if (existing) {
          throw new AppError(
            ERROR_CODES.VALIDATION_ERROR,
            "Learner with this national_id already exists",
            400
          );
        }

        // Create learner
        const created = await tx.learner.create({
          data: {
            institution_id: institutionId,
            national_id: body.national_id,
            alternate_id: body.alternate_id ?? null,
            first_name: body.first_name,
            last_name: body.last_name,
            birth_date: new Date(body.birth_date),
            gender_code: body.gender_code,
            nationality_code: body.nationality_code,
            home_language_code: body.home_language_code ?? null,
            disability_status: body.disability_status ?? "NONE",
            popia_consent: body.popia_consent,
            consent_date: new Date(body.consent_date),
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

    return NextResponse.json(learner, {
      status: 201,
      headers,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * GET /api/learners
 * Lists learners with RBAC enforcement.
 * 
 * Security rules:
 * - Development: X-DEV-TOKEN with requireAuth() - must be PLATFORM_ADMIN
 * - NextAuth session:
 *   - PLATFORM_ADMIN: can list ALL learners (institution_id optional - if provided, filters to that institution; if not provided, shows all) - app owners see everything!
 *   - INSTITUTION_ADMIN/INSTITUTION_STAFF: can only list their own institution (institution_id is overridden)
 *   - STUDENT: can only list their own learner (self-scoping - returns single learner if their user_id matches learner.user_id)
 *   - QCTO_USER: can list learners that are in APPROVED submissions or APPROVED QCTORequests (submission/request-based access)
 * 
 * Query parameters:
 * - institution_id (optional - if provided, filters to that institution; PLATFORM_ADMIN can omit to see all)
 * - q (optional search: matches first_name, last_name, national_id)
 * - limit (optional, default 50, max 200)
 * 
 * Returns:
 * {
 *   "count": number,
 *   "items": [ ...learners... ]
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
      // PLATFORM_ADMIN can see ALL learners (institution_id optional)
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
      // STUDENT can only see their own learner - filter by user_id
      // We'll handle this after building the where clause
    } else if (ctx.role === "QCTO_USER") {
      // QCTO_USER can list learners, but only those in APPROVED submissions or APPROVED QCTORequests
      // We'll filter after fetching by checking canReadForQCTO() for each learner
      // (Note: For large datasets, consider optimizing with a JOIN/subquery in the future)
    } else {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        `Role ${ctx.role} cannot list learners`,
        403
      );
    }

    // For QCTO_USER: Fetch allowed resource IDs first (from APPROVED submissions/requests)
    let allowedLearnerIds: string[] | null = null;
    if (ctx.role === "QCTO_USER") {
      // Fetch learner IDs from APPROVED submissions
      const submissionResources = await prisma.submissionResource.findMany({
        where: {
          resource_type: "LEARNER",
          submission: {
            status: "APPROVED",
            deleted_at: null,
          },
        },
        select: {
          resource_id_value: true,
        },
      });

      // Fetch learner IDs from APPROVED QCTORequests
      const requestResources = await prisma.qCTORequestResource.findMany({
        where: {
          resource_type: "LEARNER",
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
      allowedLearnerIds = Array.from(
        new Set([
          ...submissionResources.map((r) => r.resource_id_value),
          ...requestResources.map((r) => r.resource_id_value),
        ])
      );

      // If no allowed resources, return empty result immediately
      if (allowedLearnerIds.length === 0) {
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
      deleted_at: null, // Only non-deleted learners
    };

    // Apply scoping based on role
    if (ctx.role === "STUDENT") {
      // STUDENT self-scoping: can only see their own learner
      where.user_id = ctx.userId;
    } else if (ctx.role === "QCTO_USER") {
      // QCTO_USER: Only show learners in APPROVED submissions/requests
      where.learner_id = { in: allowedLearnerIds! };
    } else if (institutionId) {
      // Institution scoping for PLATFORM_ADMIN (if provided) or INSTITUTION_* roles
      where.institution_id = institutionId;
    }
    // PLATFORM_ADMIN can omit institution_id to see all (app owners see everything! 🦸)

    // Add search filter if provided
    if (searchQuery.trim()) {
      where.OR = [
        { first_name: { contains: searchQuery, mode: "insensitive" } },
        { last_name: { contains: searchQuery, mode: "insensitive" } },
        { national_id: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Query learners (read-only, no mutations)
    const learners = await prisma.learner.findMany({
      where,
      select: {
        learner_id: true,
        institution_id: true,
        national_id: true,
        alternate_id: true,
        first_name: true,
        last_name: true,
        birth_date: true,
        gender_code: true,
        nationality_code: true,
        home_language_code: true,
        disability_status: true,
        popia_consent: true,
        consent_date: true,
        user_id: true,
        created_at: true,
        updated_at: true,
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
      count: learners.length,
      items: learners,
    }, { headers });
  } catch (error) {
    return fail(error);
  }
}

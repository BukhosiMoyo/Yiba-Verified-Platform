// GET /api/enrolments/[enrolmentId] - Get a single enrolment by ID
//
// Test commands (ready-to-copy):
//   # With dev token (development only):
//   export BASE_URL="https://yibaverified.co.za"
//   export DEV_API_TOKEN="<PASTE_DEV_TOKEN_HERE>"
//   curl -sS "$BASE_URL/api/enrolments/<ENROLMENT_ID>" \
//     -H "X-DEV-TOKEN: $DEV_API_TOKEN" | jq
//
//   # With NextAuth session:
//   curl -sS "$BASE_URL/api/enrolments/<ENROLMENT_ID>" \
//     -H "Cookie: next-auth.session-token=<SESSION_TOKEN>" | jq

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { assertCanReadForQCTO } from "@/lib/api/qctoAccess";

/**
 * GET /api/enrolments/[enrolmentId]
 * Gets a single enrolment by ID with RBAC enforcement.
 * 
 * Authentication:
 * - Supports both X-DEV-TOKEN (dev only) and NextAuth session
 * 
 * RBAC rules:
 * - PLATFORM_ADMIN: can read any enrolment (app owners see everything! 🦸)
 * - INSTITUTION_ADMIN / INSTITUTION_STAFF: can only read enrolments for their own institution (ctx.institutionId must match enrolment.institution_id)
 * - STUDENT: can only read their own enrolments (ctx.userId must match enrolment.learner.user_id - self-scoping)
 * - QCTO_USER: can read enrolment if resource is in an APPROVED submission or APPROVED QCTORequest (submission/request-based access via canReadForQCTO())
 * 
 * Data rules:
 * - Must ignore soft-deleted enrolments (deleted_at must be null); if not found -> 404
 * - Use explicit select (no accidental extra fields)
 * 
 * Returns:
 * - 200 with the enrolment object on success
 * - Standard fail() errors: 401 (unauthenticated), 403 (forbidden), 404 (not found)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ enrolmentId: string }> }
) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);

    // Await params for Next.js 16 compatibility
    const { enrolmentId } = await params;
    const { searchParams } = new URL(request.url);
    const institutionIdParam = searchParams.get("institution_id");

    // Parse enrolmentId (should be a UUID)
    if (!enrolmentId || typeof enrolmentId !== "string") {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid enrolmentId parameter",
        400
      );
    }

    // STUDENT can read their own enrolments - check happens after fetching enrolment data

    // Fetch enrolment from database (must check deleted_at in where clause)
    const enrolment = await prisma.enrolment.findUnique({
      where: { enrolment_id: enrolmentId },
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
        deleted_at: true, // Include to check soft-delete
        learner: {
          select: {
            learner_id: true,
            user_id: true,
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
      },
    });

    // Check if enrolment exists and is not soft-deleted
    if (!enrolment || enrolment.deleted_at !== null) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Enrolment not found",
        404
      );
    }

    // Remove deleted_at from response
    const { deleted_at: _, ...enrolmentResponse } = enrolment;

    // RBAC: QCTO_USER access check (submission/request-based)
    if (ctx.role === "QCTO_USER") {
      // QCTO can only access resources in APPROVED submissions or APPROVED QCTORequests
      await assertCanReadForQCTO(ctx, "ENROLMENT", enrolmentId);
      // If we get here, QCTO has access - continue
    }

    // RBAC: Self-scoping rules (check STUDENT first)
    if (ctx.role === "STUDENT") {
      // STUDENT can only read their own enrolments (self-scoping)
      if (!enrolment.learner.user_id || enrolment.learner.user_id !== ctx.userId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Students can only view their own enrolments",
          403
        );
      }
      // STUDENT access granted - can view their own data
    } else if (ctx.role === "PLATFORM_ADMIN") {
      // PLATFORM_ADMIN can read any enrolment, but if institution_id query param is provided, enforce it matches
      if (institutionIdParam && institutionIdParam !== enrolment.institution_id) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Provided institution_id does not match enrolment's institution_id",
          403
        );
      }
    } else if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      // Institution roles can only read enrolments for their own institution
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Institution users must belong to an institution",
          403
        );
      }

      if (ctx.institutionId !== enrolment.institution_id) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Cannot read enrolments from other institutions",
          403
        );
      }
    }

    // Add debug header in development (shows which auth method was used)
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }

    return NextResponse.json(enrolmentResponse, { headers });
  } catch (error) {
    return fail(error);
  }
}


// GET /api/learners/[learnerId] - Get a single learner by ID
//
// Test commands (ready-to-copy):
//   # With dev token (development only):
//   curl -sS https://yibaverified.co.za/api/learners/<LEARNER_ID> \
//     -H "X-DEV-TOKEN: <PASTE_DEV_TOKEN_HERE>" | jq
//
//   # With NextAuth session:
//   curl -sS https://yibaverified.co.za/api/learners/<LEARNER_ID> \
//     -H "Cookie: next-auth.session-token=<SESSION_TOKEN>" | jq

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { assertCanReadForQCTO } from "@/lib/api/qctoAccess";

/**
 * GET /api/learners/[learnerId]
 * Gets a single learner by ID with RBAC enforcement.
 * 
 * Authentication:
 * - Supports both X-DEV-TOKEN (dev only) and NextAuth session
 * 
 * RBAC rules:
 * - PLATFORM_ADMIN: can read any learner (app owners see everything! 🦸) - if query param "institution_id" is provided, enforce it matches the learner's institution_id (extra safety)
 * - INSTITUTION_ADMIN / INSTITUTION_STAFF: can only read learners for their own institution (ctx.institutionId must match learner.institution_id)
 * - STUDENT: can only read their own learner (ctx.userId must match learner.user_id - self-scoping)
 * - QCTO_USER: can read learner if resource is in an APPROVED submission or APPROVED QCTORequest (submission/request-based access via canReadForQCTO())
 * 
 * Data rules:
 * - Must ignore soft-deleted learners (deleted_at must be null); if not found -> 404
 * - Use explicit select (no accidental extra fields)
 * 
 * Returns:
 * - 200 with the learner object on success
 * - Standard fail() errors: 401 (unauthenticated), 403 (forbidden), 404 (not found)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ learnerId: string }> }
) {
  try {
    // Use shared auth resolver (handles both dev token and NextAuth)
    const { ctx, authMode } = await requireAuth(request);

    // Await params for Next.js 16 compatibility
    const { learnerId } = await params;
    const { searchParams } = new URL(request.url);
    const institutionIdParam = searchParams.get("institution_id");

    // Parse learnerId (should be a UUID)
    if (!learnerId || typeof learnerId !== "string") {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid learnerId parameter",
        400
      );
    }

    // STUDENT can read their own learner - check happens after fetching learner data

    // Fetch learner from database (must check deleted_at in where clause)
    // Note: Prisma findUnique doesn't support where conditions directly, so we fetch and filter
    const learner = await prisma.learner.findUnique({
      where: { learner_id: learnerId },
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
        deleted_at: true, // Include to check soft-delete
      },
    });

    // Check if learner exists and is not soft-deleted
    if (!learner || learner.deleted_at !== null) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Learner not found",
        404
      );
    }

    // Remove deleted_at from response (explicit select doesn't prevent returning it, so we exclude it manually)
    const { deleted_at: _, ...learnerResponse } = learner;

    // RBAC: QCTO_USER access check (submission/request-based)
    if (ctx.role === "QCTO_USER") {
      // QCTO can only access resources in APPROVED submissions or APPROVED QCTORequests
      await assertCanReadForQCTO(ctx, "LEARNER", learnerId);
      // If we get here, QCTO has access - continue
    }

    // RBAC: Self-scoping rules (check STUDENT first)
    if (ctx.role === "STUDENT") {
      // STUDENT can only read their own learner (self-scoping)
      if (!learner.user_id || learner.user_id !== ctx.userId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Students can only view their own learner profile",
          403
        );
      }
      // STUDENT access granted - can view their own data
    } else if (ctx.role === "PLATFORM_ADMIN") {
      // PLATFORM_ADMIN can read any learner, but if institution_id query param is provided, enforce it matches
      if (institutionIdParam && institutionIdParam !== learner.institution_id) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Provided institution_id does not match learner's institution_id",
          403
        );
      }
    } else if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      // Institution roles can only read learners for their own institution
      if (!ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Institution users must belong to an institution",
          403
        );
      }

      if (ctx.institutionId !== learner.institution_id) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Cannot read learners from other institutions",
          403
        );
      }
    }

    // Add debug header in development (shows which auth method was used)
    const headers: Record<string, string> = {};
    if (process.env.NODE_ENV === "development") {
      headers["X-AUTH-MODE"] = authMode;
    }

    return NextResponse.json(learnerResponse, { headers });
  } catch (error) {
    return fail(error);
  }
}

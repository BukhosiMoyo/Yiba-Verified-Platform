import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { getCurrentInstitutionForUser } from "@/lib/currentInstitution";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { cookies } from "next/headers";

const COOKIE_NAME = "current_institution_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * POST /api/institution/context
 *
 * Body: { institution_id: string }
 *
 * Sets the "current institution" cookie for multi-institution users.
 * institution_id must be one of the user's institutions.
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only institution users can set institution context",
        403
      );
    }

    let body: { institution_id?: string };
    try {
      body = await request.json();
    } catch {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid JSON body", 400);
    }

    const institutionId = body?.institution_id;
    if (typeof institutionId !== "string" || !institutionId.trim()) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "institution_id is required and must be a non-empty string",
        400
      );
    }

    const resolved = await getCurrentInstitutionForUser(ctx.userId, null);
    if (!resolved.institutionIds.includes(institutionId)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "You do not have access to this institution",
        403
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, institutionId, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      currentInstitutionId: institutionId,
    });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    const message = err instanceof Error ? err.message : "Failed to set institution context";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

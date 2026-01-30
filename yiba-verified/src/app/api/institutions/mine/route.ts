import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/api/context";
import { getCurrentInstitutionForUser } from "@/lib/currentInstitution";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/institutions/mine
 *
 * Returns the current user's institutions (for INSTITUTION_ADMIN / INSTITUTION_STAFF).
 * Used by the institution context switcher.
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only institution users can list their institutions",
        403
      );
    }

    const cookieStore = await cookies();
    const preferredId = cookieStore.get("current_institution_id")?.value ?? null;
    const resolved = await getCurrentInstitutionForUser(ctx.userId, preferredId);

    return NextResponse.json({
      currentInstitutionId: resolved.currentInstitutionId,
      institutionIds: resolved.institutionIds,
      institutions: resolved.institutions,
      canAdd: ctx.role === "INSTITUTION_ADMIN",
    });
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    const message = err instanceof Error ? err.message : "Failed to list institutions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/qcto/public-profiles - List institution public profiles for QCTO verification.
 * QCTO and PLATFORM_ADMIN only. Province-scoped for QCTO (non-super) via user assigned_provinces.
 */

import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";

const QCTO_ADMIN_ROLES = ["QCTO_SUPER_ADMIN", "QCTO_ADMIN", "PLATFORM_ADMIN"] as const;

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);
    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO or Platform Admin can list public profiles", 403));
    }

    const user = await prisma.user.findUnique({
      where: { user_id: ctx.userId },
      select: { assigned_provinces: true, default_province: true },
    });
    const provinces: string[] = user?.assigned_provinces ?? (user?.default_province ? [user.default_province] : []);
    const isNational = ctx.role === "QCTO_SUPER_ADMIN" || ctx.role === "PLATFORM_ADMIN" || provinces.length === 0;

    const where: Prisma.InstitutionPublicProfileWhereInput = {
      institution: !isNational && provinces.length > 0
        ? { deleted_at: null, province: { in: provinces } }
        : { deleted_at: null },
    };

    const profiles = await prisma.institutionPublicProfile.findMany({
      where,
      include: {
        institution: {
          select: {
            institution_id: true,
            legal_name: true,
            trading_name: true,
            province: true,
          },
        },
      },
      orderBy: [{ updated_at: "desc" }],
    });

    const items = profiles.map((p) => ({
      id: p.id,
      institution_id: p.institution_id,
      slug: p.slug,
      is_public: p.is_public,
      verification_status: p.verification_status,
      verified_at: p.verified_at,
      institution: p.institution,
    }));

    return Response.json({ items });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/qcto/public-profiles error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to list public profiles", 500));
  }
}

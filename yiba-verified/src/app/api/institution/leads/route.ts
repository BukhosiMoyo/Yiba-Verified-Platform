/**
 * GET /api/institution/leads - List leads for current institution (INSTITUTION_ADMIN or INSTITUTION_STAFF with CAN_VIEW_LEADS)
 */

import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);
    if (!ctx.institutionId) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "User is not associated with an institution", 403));
    }
    const canView =
      ctx.role === "PLATFORM_ADMIN" ||
      ctx.role === "INSTITUTION_ADMIN" ||
      (ctx.role === "INSTITUTION_STAFF" && hasCap(ctx.role, "CAN_VIEW_LEADS"));
    if (!canView) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "You do not have permission to view leads", 403));
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim() || "";
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const where: Prisma.InstitutionLeadWhereInput = {
      institution_id: ctx.institutionId,
    };
    if (status && ["NEW", "CONTACTED", "CLOSED"].includes(status)) {
      where.status = status as "NEW" | "CONTACTED" | "CLOSED";
    }
    if (search.length >= 2) {
      where.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.institutionLead.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.institutionLead.count({ where }),
    ]);

    return Response.json({ items, total, page, limit });
  } catch (error) {
    if (error instanceof AppError) return fail(error);
    console.error("GET /api/institution/leads error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to list leads", 500));
  }
}

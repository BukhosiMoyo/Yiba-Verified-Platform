// GET /api/platform-admin/qualifications - List all qualifications (PLATFORM_ADMIN only)
// POST /api/platform-admin/qualifications - Create a new qualification (PLATFORM_ADMIN only)
//
// GET Query params:
//   ?q=searchText - Search in name or code
//   ?limit=number - Limit results (default: 50, max: 200)
//   ?offset=number - Offset for pagination
//
// POST Body:
//   { "name": string, "code"?: string }
//
// Example GET:
//   curl -sS https://yibaverified.co.za/api/platform-admin/qualifications \
//     -H "X-DEV-TOKEN: <DEV_TOKEN>" | jq
//
// Example POST:
//   curl -X POST https://yibaverified.co.za/api/platform-admin/qualifications \
//     -H "Content-Type: application/json" \
//     -H "X-DEV-TOKEN: <DEV_TOKEN>" \
//     -d '{"name":"Diploma in IT","code":"DIT001"}'

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

/**
 * GET /api/platform-admin/qualifications
 * Lists all qualifications (PLATFORM_ADMIN only).
 * 
 * RBAC: Only PLATFORM_ADMIN can access this endpoint.
 * 
 * Returns:
 * {
 *   "count": number,
 *   "total": number,
 *   "items": Qualification[]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Only PLATFORM_ADMIN
    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can access this endpoint",
        403
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";
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

    if (isNaN(offset) || offset < 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid offset parameter (must be a non-negative number)",
        400
      );
    }

    // Build where clause
    const where: any = {
      deleted_at: null, // Only non-deleted qualifications
    };

    // Filters
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const nqfLevel = searchParams.get("nqf_level");

    if (type) where.type = type;
    if (status) where.status = status;
    if (nqfLevel) where.nqf_level = parseInt(nqfLevel, 10);

    // Add search filter if provided
    if (searchQuery.trim()) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { code: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Get total count (for pagination)
    const total = await prisma.qualification.count({ where });

    // Query qualifications
    const qualifications = await prisma.qualification.findMany({
      where,
      orderBy: {
        created_at: "desc", // Newest first
      },
      skip: offset,
      take: limit,
    });

    return ok({
      count: qualifications.length,
      total,
      items: qualifications,
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /api/platform-admin/qualifications
 * Creates a new qualification (PLATFORM_ADMIN only).
 * 
 * RBAC: Only PLATFORM_ADMIN can access this endpoint.
 * 
 * Body: { name, code, type, nqf_level, status, summary, study_mode, duration_value, duration_unit, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Only PLATFORM_ADMIN
    if (ctx.role !== "PLATFORM_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only PLATFORM_ADMIN can create qualifications",
        403
      );
    }

    const body = await request.json();
    const {
      name, code, type, nqf_level, status, summary,
      study_mode, duration_value, duration_unit,
      credits, regulatory_body, seta, entry_requirements, assessment_type,
      workplace_required, workplace_hours, language_of_delivery, career_outcomes, modules
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Name is required", 400);
    }
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Code is required", 400);
    }
    if (nqf_level && (nqf_level < 1 || nqf_level > 10)) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "NQF Level must be between 1 and 10", 400);
    }
    if (duration_value && duration_value <= 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Duration value must be positive", 400);
    }

    // Check for duplicate name or code (case-insensitive)
    const existing = await prisma.qualification.findFirst({
      where: {
        OR: [
          { name: { equals: name.trim(), mode: "insensitive" } },
          { code: { equals: code.trim(), mode: "insensitive" } }
        ],
        deleted_at: null,
      },
    });

    if (existing) {
      if (existing.name.toLowerCase() === name.trim().toLowerCase()) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "A qualification with this name already exists", 409);
      }
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "A qualification with this code already exists", 409);
    }

    // Create qualification with audit
    const qualification = await mutateWithAudit({
      ctx,
      entityType: "QUALIFICATION",
      changeType: "CREATE",
      fieldName: "qualification_id",
      assertCan: async () => { },
      mutation: async (tx) =>
        tx.qualification.create({
          data: {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            type: type || "OTHER",
            nqf_level: nqf_level || 1,
            status: status || "DRAFT",
            summary: summary || "",
            study_mode: study_mode || "ON_SITE",
            duration_value: duration_value || 12,
            duration_unit: duration_unit || "MONTHS",
            credits,
            regulatory_body,
            seta,
            entry_requirements,
            assessment_type,
            workplace_required: workplace_required || false,
            workplace_hours,
            language_of_delivery,
            career_outcomes: Array.isArray(career_outcomes) ? career_outcomes : [],
            modules: Array.isArray(modules) ? modules : [],
          },
        }),
    });

    return ok(qualification, 201);
  } catch (error) {
    return fail(error);
  }
}

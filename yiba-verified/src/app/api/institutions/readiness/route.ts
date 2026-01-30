import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { mutateWithAudit } from "@/server/mutations/mutate";
import type { DeliveryMode } from "@prisma/client";

/**
 * GET /api/institutions/readiness
 * 
 * Lists readiness records for the institution.
 * 
 * Access Control:
 * - INSTITUTION_* roles: Can view their institution's readiness records
 * - PLATFORM_ADMIN: Can view all readiness records
 * - Other roles: 403 Forbidden
 * 
 * Query Parameters:
 * - qualification_id: Filter by qualification ID
 * - status: Filter by readiness status
 * - limit: Number of results (default: 50, max: 200)
 * - offset: Pagination offset (default: 0)
 * 
 * Returns: { count: number, items: Readiness[] }
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Institution roles and PLATFORM_ADMIN can view
    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions to view readiness records", 403);
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const qualificationId = searchParams.get("qualification_id") || null;
    const status = searchParams.get("status") || null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {
      deleted_at: null,
    };

    // Institution scoping (for INSTITUTION_* roles)
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId) {
        throw new AppError(ERROR_CODES.FORBIDDEN, "Institution ID required for institution roles", 403);
      }
      where.institution_id = ctx.institutionId;
    }
    // PLATFORM_ADMIN sees all (no institution filter)

    if (qualificationId) {
      // Note: readiness doesn't have qualification_id directly, but qualification_title is stored
      // For now, we'll filter by qualification_title or saqa_id
      where.OR = [
        { qualification_title: { contains: qualificationId, mode: "insensitive" } },
        { saqa_id: qualificationId },
      ];
    }

    if (status) {
      where.readiness_status = status;
    }

    // Fetch readiness records
    const [items, count] = await Promise.all([
      prisma.readiness.findMany({
        where,
        include: {
          institution: {
            select: {
              institution_id: true,
              legal_name: true,
              trading_name: true,
            },
          },
          documents: {
            take: 1,
            orderBy: { uploaded_at: "desc" },
            select: {
              document_id: true,
              file_name: true,
            },
          },
          recommendation: {
            select: {
              recommendation_id: true,
              recommendation: true,
              remarks: true,
              created_at: true,
            },
          },
          _count: {
            select: {
              documents: true,
            },
          },
        },
        orderBy: { updated_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.readiness.count({ where }),
    ]);

    // Format response
    const formattedItems = items.map((readiness) => ({
      readiness_id: readiness.readiness_id,
      institution_id: readiness.institution_id,
      institution: readiness.institution
        ? {
            institution_id: readiness.institution.institution_id,
            legal_name: readiness.institution.legal_name,
            trading_name: readiness.institution.trading_name,
          }
        : null,
      qualification_title: readiness.qualification_title,
      saqa_id: readiness.saqa_id,
      nqf_level: readiness.nqf_level,
      curriculum_code: readiness.curriculum_code,
      delivery_mode: readiness.delivery_mode,
      readiness_status: readiness.readiness_status,
      submission_date: readiness.submission_date?.toISOString() || null,
      created_at: readiness.created_at.toISOString(),
      updated_at: readiness.updated_at.toISOString(),
      document_count: readiness._count.documents,
      recommendation: readiness.recommendation,
    }));

    return NextResponse.json(
      {
        count,
        items: formattedItems,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return fail(error);
  }
}

interface CreateReadinessBody {
  qualification_registry_id?: string | null;
  qualification_title?: string;
  saqa_id?: string;
  nqf_level?: number;
  curriculum_code?: string;
  credits?: number;
  occupational_category?: string;
  delivery_mode: DeliveryMode;
  institution_id?: string; // optional, for PLATFORM_ADMIN when creating for a specific institution
}

/**
 * POST /api/institutions/readiness
 * 
 * Creates a new readiness record.
 * 
 * Access Control:
 * - INSTITUTION_* roles: Can create readiness for their institution
 * - PLATFORM_ADMIN: Can create readiness for any institution
 * - Other roles: 403 Forbidden
 * 
 * Request Body:
 * {
 *   qualification_title: string,
 *   saqa_id: string,
 *   nqf_level?: number,
 *   curriculum_code: string,
 *   delivery_mode: DeliveryMode
 * }
 * 
 * Returns: Readiness
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    // RBAC: Institution roles and PLATFORM_ADMIN can create
    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions to create readiness records", 403);
    }

    // Institution scoping
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId) {
        throw new AppError(ERROR_CODES.FORBIDDEN, "Institution ID required for institution roles", 403);
      }
    }

    const body: CreateReadinessBody = await request.json();

    if (!body.delivery_mode) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "delivery_mode is required", 400);
    }

    let qualification_title: string;
    let saqa_id: string;
    let curriculum_code: string;
    let nqf_level: number | null = body.nqf_level ?? null;
    let credits: number | null = body.credits ?? null;
    let occupational_category: string | null = body.occupational_category?.trim() || null;
    let qualification_registry_id: string | null = body.qualification_registry_id?.trim() || null;

    if (body.qualification_registry_id) {
      const registry = await prisma.qualificationRegistry.findFirst({
        where: { id: body.qualification_registry_id, deleted_at: null, status: "ACTIVE" },
      });
      if (!registry) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Qualification registry entry not found or not active", 400);
      }
      qualification_title = registry.name;
      saqa_id = registry.saqa_id ?? "";
      curriculum_code = registry.curriculum_code ?? "";
      nqf_level = registry.nqf_level ?? nqf_level;
      credits = registry.credits ?? credits;
      occupational_category = registry.occupational_category ?? occupational_category;
    } else {
      qualification_title = body.qualification_title?.trim() ?? "";
      saqa_id = body.saqa_id?.trim() ?? "";
      curriculum_code = body.curriculum_code?.trim() ?? "";
      if (!qualification_title || !saqa_id || !curriculum_code) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Missing required fields: qualification_title, saqa_id, curriculum_code (or provide qualification_registry_id)", 400);
      }
    }

    // Check for duplicate (same institution + saqa_id + not deleted)
    const existing = await prisma.readiness.findFirst({
      where: {
        institution_id: ctx.institutionId || body.institution_id || "",
        saqa_id,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Readiness record already exists for this SAQA ID", 409);
    }

    // Create readiness record
    const readiness = await mutateWithAudit({
      entityType: "READINESS",
      changeType: "CREATE",
      fieldName: "readiness_id",
      institutionId: ctx.institutionId || null,
      reason: `Create readiness record for qualification: ${qualification_title} (SAQA ID: ${saqa_id})`,
      assertCan: async () => {},
      mutation: async (tx) =>
        tx.readiness.create({
          data: {
            institution_id: ctx.institutionId || body.institution_id || "",
            qualification_registry_id,
            qualification_title,
            saqa_id,
            nqf_level,
            curriculum_code,
            credits,
            occupational_category,
            delivery_mode: body.delivery_mode,
            readiness_status: "NOT_STARTED",
          },
        }),
    });

    return NextResponse.json(readiness, { status: 201 });
  } catch (error: any) {
    return fail(error);
  }
}

// GET /api/qcto/qualifications - List QualificationRegistry (QCTO + Institution read, QCTO Admin mutate)
// POST /api/qcto/qualifications - Create QualificationRegistry (QCTO_ADMIN, QCTO_SUPER_ADMIN, PLATFORM_ADMIN only)
//
// GET Query: q, status, nqf_level, occupational_category, limit, offset
// Institutions can call GET for picker (read-only).

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
const QCTO_QUALIFICATION_MUTATE_ROLES = ["QCTO_ADMIN", "QCTO_SUPER_ADMIN", "PLATFORM_ADMIN"] as const;
const QUALIFICATION_READ_ROLES = [
  "QCTO_USER",
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "QCTO_REVIEWER",
  "QCTO_AUDITOR",
  "QCTO_VIEWER",
  "PLATFORM_ADMIN",
  "INSTITUTION_ADMIN",
  "INSTITUTION_STAFF",
] as const;

function canMutateQualificationRegistry(role: string): boolean {
  return QCTO_QUALIFICATION_MUTATE_ROLES.includes(role as (typeof QCTO_QUALIFICATION_MUTATE_ROLES)[number]);
}

function canReadQualificationRegistry(role: string): boolean {
  return QUALIFICATION_READ_ROLES.includes(role as (typeof QUALIFICATION_READ_ROLES)[number]);
}

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!canReadQualificationRegistry(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Insufficient permissions to list qualifications",
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const statusParam = searchParams.get("status") || "";
    const nqfLevelParam = searchParams.get("nqf_level") || "";
    const occupationalCategoryParam = searchParams.get("occupational_category")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const where: Record<string, unknown> = {
      deleted_at: null,
    };

    if (statusParam && ["ACTIVE", "INACTIVE", "RETIRED", "DRAFT"].includes(statusParam)) {
      where.status = statusParam;
    }
    if (nqfLevelParam && !isNaN(parseInt(nqfLevelParam, 10))) {
      where.nqf_level = parseInt(nqfLevelParam, 10);
    }
    if (occupationalCategoryParam) {
      where.occupational_category = { contains: occupationalCategoryParam, mode: "insensitive" };
    }

    if (q.length >= 1) {
      where.AND = [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
            { saqa_id: { contains: q, mode: "insensitive" } },
            { curriculum_code: { contains: q, mode: "insensitive" } },
            { aliases: { some: { alias: { contains: q, mode: "insensitive" } } } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.qualificationRegistry.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          saqa_id: true,
          curriculum_code: true,
          nqf_level: true,
          credits: true,
          occupational_category: true,
          description: true,
          status: true,
          effective_from: true,
          effective_to: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { name: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.qualificationRegistry.count({ where }),
    ]);

    return ok({ items, total });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!canMutateQualificationRegistry(ctx.role)) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only QCTO Admin, QCTO Super Admin, or Platform Admin can create qualifications",
        403
      );
    }

    const body = await request.json();
    const {
      name,
      code,
      saqa_id,
      curriculum_code,
      nqf_level,
      credits,
      occupational_category,
      description,
      status,
      effective_from,
      effective_to,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Name is required and must be a non-empty string",
        400
      );
    }

    const created = await mutateWithAudit({
      ctx,
      entityType: "QUALIFICATION_REGISTRY",
      changeType: "CREATE",
      fieldName: "id",
      allowQctoReviewOperations: true,
      assertCan: async () => {
        if (!canMutateQualificationRegistry(ctx.role)) {
          throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions", 403);
        }
      },
      mutation: async (tx) =>
        tx.qualificationRegistry.create({
          data: {
            name: name.trim(),
            code: code != null && code !== "" ? String(code).trim() : null,
            saqa_id: saqa_id != null && saqa_id !== "" ? String(saqa_id).trim() : null,
            curriculum_code: curriculum_code != null && curriculum_code !== "" ? String(curriculum_code).trim() : null,
            nqf_level: nqf_level != null && nqf_level !== "" ? parseInt(String(nqf_level), 10) : null,
            credits: credits != null && credits !== "" ? parseInt(String(credits), 10) : null,
            occupational_category: occupational_category != null && occupational_category !== "" ? String(occupational_category).trim() : null,
            description: description != null && description !== "" ? String(description).trim() : null,
            status: status && ["ACTIVE", "INACTIVE", "RETIRED", "DRAFT"].includes(status) ? status : "ACTIVE",
            effective_from: effective_from ? new Date(effective_from) : null,
            effective_to: effective_to ? new Date(effective_to) : null,
            created_by_id: ctx.userId,
            updated_by_id: ctx.userId,
          },
          select: {
            id: true,
            name: true,
            code: true,
            saqa_id: true,
            curriculum_code: true,
            nqf_level: true,
            credits: true,
            occupational_category: true,
            description: true,
            status: true,
            effective_from: true,
            effective_to: true,
            created_at: true,
            updated_at: true,
          },
        }),
    });

    return ok(created, 201);
  } catch (error) {
    return fail(error);
  }
}

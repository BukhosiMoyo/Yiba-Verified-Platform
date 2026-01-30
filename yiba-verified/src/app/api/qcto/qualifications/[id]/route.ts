// GET /api/qcto/qualifications/[id] - Single QualificationRegistry with aliases, versions, usage count
// PATCH /api/qcto/qualifications/[id] - Update (QCTO_ADMIN, QCTO_SUPER_ADMIN, PLATFORM_ADMIN only)

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

function canMutate(role: string): boolean {
  return QCTO_QUALIFICATION_MUTATE_ROLES.includes(role as (typeof QCTO_QUALIFICATION_MUTATE_ROLES)[number]);
}

function canRead(role: string): boolean {
  return QUALIFICATION_READ_ROLES.includes(role as (typeof QUALIFICATION_READ_ROLES)[number]);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { id } = await params;

    if (!canRead(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions to view qualification", 403);
    }

    const item = await prisma.qualificationRegistry.findFirst({
      where: { id, deleted_at: null },
      include: {
        aliases: { orderBy: { alias: "asc" } },
        versions: { orderBy: { created_at: "desc" }, take: 20 },
        _count: { select: { readiness_records: true } },
        readiness_records: {
          take: 10,
          orderBy: { updated_at: "desc" },
          select: {
            readiness_id: true,
            qualification_title: true,
            readiness_status: true,
            institution_id: true,
            institution: { select: { legal_name: true, trading_name: true } },
          },
        },
      },
    });

    if (!item) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Qualification not found", 404);
    }

    return ok(item);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { id } = await params;

    if (!canMutate(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO Admin, QCTO Super Admin, or Platform Admin can update qualifications", 403);
    }

    const existing = await prisma.qualificationRegistry.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Qualification not found", 404);
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = typeof body.name === "string" ? body.name.trim() : existing.name;
    if (body.code !== undefined) updates.code = body.code === null || body.code === "" ? null : String(body.code).trim();
    if (body.saqa_id !== undefined) updates.saqa_id = body.saqa_id === null || body.saqa_id === "" ? null : String(body.saqa_id).trim();
    if (body.curriculum_code !== undefined) updates.curriculum_code = body.curriculum_code === null || body.curriculum_code === "" ? null : String(body.curriculum_code).trim();
    if (body.nqf_level !== undefined) updates.nqf_level = body.nqf_level === null || body.nqf_level === "" ? null : parseInt(String(body.nqf_level), 10);
    if (body.credits !== undefined) updates.credits = body.credits === null || body.credits === "" ? null : parseInt(String(body.credits), 10);
    if (body.occupational_category !== undefined) updates.occupational_category = body.occupational_category === null || body.occupational_category === "" ? null : String(body.occupational_category).trim();
    if (body.description !== undefined) updates.description = body.description === null || body.description === "" ? null : String(body.description).trim();
    if (body.status !== undefined && ["ACTIVE", "INACTIVE", "RETIRED", "DRAFT"].includes(body.status)) updates.status = body.status;
    if (body.effective_from !== undefined) updates.effective_from = body.effective_from ? new Date(body.effective_from) : null;
    if (body.effective_to !== undefined) updates.effective_to = body.effective_to ? new Date(body.effective_to) : null;
    updates.updated_by_id = ctx.userId;

    const updated = await mutateWithAudit({
      ctx,
      entityType: "QUALIFICATION_REGISTRY",
      entityId: id,
      changeType: "UPDATE",
      fieldName: "updated_at",
      oldValue: existing,
      newValue: updates,
      allowQctoReviewOperations: true,
      assertCan: async () => {
        if (!canMutate(ctx.role)) throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions", 403);
      },
      mutation: async (tx) =>
        tx.qualificationRegistry.update({
          where: { id },
          data: {
            ...(updates.name !== undefined && { name: updates.name as string }),
            ...(updates.code !== undefined && { code: updates.code as string | null }),
            ...(updates.saqa_id !== undefined && { saqa_id: updates.saqa_id as string | null }),
            ...(updates.curriculum_code !== undefined && { curriculum_code: updates.curriculum_code as string | null }),
            ...(updates.nqf_level !== undefined && { nqf_level: updates.nqf_level as number | null }),
            ...(updates.credits !== undefined && { credits: updates.credits as number | null }),
            ...(updates.occupational_category !== undefined && { occupational_category: updates.occupational_category as string | null }),
            ...(updates.description !== undefined && { description: updates.description as string | null }),
            ...(updates.status !== undefined && { status: updates.status as "ACTIVE" | "INACTIVE" | "RETIRED" | "DRAFT" }),
            ...(updates.effective_from !== undefined && { effective_from: updates.effective_from as Date | null }),
            ...(updates.effective_to !== undefined && { effective_to: updates.effective_to as Date | null }),
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

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}

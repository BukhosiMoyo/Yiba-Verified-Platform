// POST /api/qcto/qualifications/[id]/aliases - Add alias
// DELETE /api/qcto/qualifications/[id]/aliases - Remove alias (body: { aliasId: string })

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

const QCTO_QUALIFICATION_MUTATE_ROLES = ["QCTO_ADMIN", "QCTO_SUPER_ADMIN", "PLATFORM_ADMIN"] as const;

function canMutate(role: string): boolean {
  return QCTO_QUALIFICATION_MUTATE_ROLES.includes(role as (typeof QCTO_QUALIFICATION_MUTATE_ROLES)[number]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { id: registryId } = await params;

    if (!canMutate(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO Admin, QCTO Super Admin, or Platform Admin can add aliases", 403);
    }

    const registry = await prisma.qualificationRegistry.findFirst({
      where: { id: registryId, deleted_at: null },
    });
    if (!registry) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Qualification not found", 404);
    }

    const body = await request.json();
    const alias = body.alias != null ? String(body.alias).trim() : "";
    const source = body.source && ["QCTO", "SAQA", "INSTITUTION", "OTHER"].includes(body.source) ? body.source : "QCTO";

    if (!alias) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "alias is required", 400);
    }

    const created = await prisma.qualificationAlias.create({
      data: { registry_id: registryId, alias, source },
      select: { id: true, registry_id: true, alias: true, source: true, created_at: true },
    });

    return ok(created, 201);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    const { id: registryId } = await params;

    if (!canMutate(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO Admin, QCTO Super Admin, or Platform Admin can remove aliases", 403);
    }

    const registry = await prisma.qualificationRegistry.findFirst({
      where: { id: registryId, deleted_at: null },
    });
    if (!registry) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Qualification not found", 404);
    }

    const aliasId = request.nextUrl.searchParams.get("aliasId") || (await request.json().catch(() => ({}))).aliasId;
    if (!aliasId) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "aliasId is required (query or body)", 400);
    }

    const aliasRecord = await prisma.qualificationAlias.findFirst({
      where: { id: aliasId, registry_id: registryId },
    });
    if (!aliasRecord) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Alias not found", 404);
    }

    await prisma.qualificationAlias.delete({ where: { id: aliasId } });
    return ok({ deleted: true });
  } catch (error) {
    return fail(error);
  }
}

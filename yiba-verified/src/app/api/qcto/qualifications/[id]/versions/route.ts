// POST /api/qcto/qualifications/[id]/versions - Create version snapshot

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
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO Admin, QCTO Super Admin, or Platform Admin can create versions", 403);
    }

    const registry = await prisma.qualificationRegistry.findFirst({
      where: { id: registryId, deleted_at: null },
    });
    if (!registry) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Qualification not found", 404);
    }

    const body = await request.json().catch(() => ({}));
    const versionLabel = body.version_label != null ? String(body.version_label).trim() : "";
    const snapshotJson = body.snapshot_json != null ? body.snapshot_json : {
      name: registry.name,
      code: registry.code,
      saqa_id: registry.saqa_id,
      curriculum_code: registry.curriculum_code,
      nqf_level: registry.nqf_level,
      credits: registry.credits,
      occupational_category: registry.occupational_category,
      description: registry.description,
      status: registry.status,
      effective_from: registry.effective_from?.toISOString?.() ?? null,
      effective_to: registry.effective_to?.toISOString?.() ?? null,
      captured_at: new Date().toISOString(),
    };

    const label = versionLabel || `snapshot-${new Date().toISOString().slice(0, 10)}`;

    const created = await prisma.qualificationVersion.create({
      data: {
        registry_id: registryId,
        version_label: label,
        snapshot_json: snapshotJson as object,
      },
      select: { id: true, registry_id: true, version_label: true, created_at: true },
    });

    return ok(created, 201);
  } catch (error) {
    return fail(error);
  }
}

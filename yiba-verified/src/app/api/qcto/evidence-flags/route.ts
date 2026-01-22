// GET /api/qcto/evidence-flags - List evidence flags (EVIDENCE_VIEW, QCTO_USER / PLATFORM_ADMIN)
//
// Query params:
//   ?q=string - Search in reason, document.file_name, flaggedByUser name/email
//   ?status=ACTIVE|RESOLVED
//   ?limit=number - Default 50, max 200
//   ?offset=number - For pagination
//
// Returns: { count: number, items: EvidenceFlag[] }

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";
import { canAccessQctoData } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can access this endpoint", 403);
    }
    if (!hasCap(ctx.role, "EVIDENCE_VIEW")) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "EVIDENCE_VIEW capability required", 403);
    }

    const { searchParams } = new URL(request.url);
    const qParam = searchParams.get("q")?.trim() || "";
    const statusParam = searchParams.get("status") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const where: Record<string, unknown> = {};

    if (statusParam && ["ACTIVE", "RESOLVED"].includes(statusParam)) {
      where.status = statusParam;
    }

    if (qParam.length > 0) {
      where.OR = [
        { reason: { contains: qParam, mode: "insensitive" } },
        { document: { file_name: { contains: qParam, mode: "insensitive" } } },
        {
          flaggedByUser: {
            OR: [
              { first_name: { contains: qParam, mode: "insensitive" } },
              { last_name: { contains: qParam, mode: "insensitive" } },
              { email: { contains: qParam, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [items, count] = await Promise.all([
      prisma.evidenceFlag.findMany({
        where,
        select: {
          flag_id: true,
          reason: true,
          status: true,
          created_at: true,
          resolved_at: true,
          flaggedByUser: { select: { first_name: true, last_name: true, email: true } },
          resolvedByUser: { select: { first_name: true, last_name: true } },
          document: {
            select: {
              document_id: true,
              file_name: true,
              document_type: true,
              mime_type: true,
              status: true,
              related_entity: true,
              institution: { select: { institution_id: true, legal_name: true, trading_name: true } },
              enrolment: {
                select: { institution: { select: { legal_name: true, trading_name: true } } },
              },
              learner: {
                select: { institution: { select: { legal_name: true, trading_name: true } } },
              },
              readiness: {
                select: { institution: { select: { legal_name: true, trading_name: true } } },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.evidenceFlag.count({ where }),
    ]);

    return Response.json({ count, items }, { status: 200 });
  } catch (error) {
    return fail(error);
  }
}

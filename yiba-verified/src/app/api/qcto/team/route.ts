// GET /api/qcto/team - List QCTO staff (requires QCTO_TEAM_MANAGE)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!hasCap(ctx.role, "QCTO_TEAM_MANAGE")) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "QCTO_TEAM_MANAGE capability required", 403);
    }

    let qctoId = ctx.qctoId;
    if (!qctoId && ctx.role === "PLATFORM_ADMIN") {
      const org = await prisma.qCTOOrg.findFirst();
      if (org) qctoId = org.id;
    }
    if (!qctoId) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "No QCTO organisation access", 403);
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    const where: { qcto_id: string; deleted_at: null } & Record<string, unknown> = {
      qcto_id: qctoId,
      deleted_at: null,
    };
    if (q.length >= 2) {
      where.OR = [
        { first_name: { contains: q, mode: "insensitive" } },
        { last_name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          status: true,
          created_at: true,
          image: true,
        },
        orderBy: [{ last_name: "asc" }, { first_name: "asc" }],
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return Response.json(
      {
        items: items.map((u) => ({
          user_id: u.user_id,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          role: u.role,
          status: u.status,
          created_at: u.created_at,
          image: u.image,
          last_login: null as string | null,
        })),
        total,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    return fail(error);
  }
}

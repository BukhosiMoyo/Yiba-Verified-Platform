// GET /api/qcto/invites - List QCTO invites (requires QCTO_TEAM_MANAGE)
// POST /api/qcto/invites - Create QCTO invite (requires QCTO_TEAM_MANAGE)

import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";

const QCTO_INVITE_ROLES = [
  "QCTO_SUPER_ADMIN",
  "QCTO_ADMIN",
  "QCTO_REVIEWER",
  "QCTO_AUDITOR",
  "QCTO_VIEWER",
] as const;

const EXPIRY_DAYS = 7;

export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!hasCap(ctx.role, "QCTO_TEAM_MANAGE")) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "QCTO_TEAM_MANAGE capability required", 403);
    }

    let qctoId = ctx.qctoId;
    if (!qctoId && hasCap(ctx.role, "QCTO_TEAM_MANAGE")) {
      const org = await prisma.qCTOOrg.findFirst();
      if (org) qctoId = org.id;
    }
    if (!qctoId) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "No QCTO organisation access", 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: any = {
      qcto_id: qctoId,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    const [invites, total] = await Promise.all([
      prisma.qCTOInvite.findMany({
        where,
        include: {
          invitedBy: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.qCTOInvite.count({ where }),
    ]);

    return Response.json({
      items: invites,
      total,
      limit,
      offset,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!hasCap(ctx.role, "QCTO_TEAM_MANAGE")) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "QCTO_TEAM_MANAGE capability required", 403);
    }

    let qctoId = ctx.qctoId;
    if (!qctoId && hasCap(ctx.role, "QCTO_TEAM_MANAGE")) {
      const org = await prisma.qCTOOrg.findFirst();
      if (org) qctoId = org.id;
    }
    if (!qctoId) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "No QCTO organisation access", 403);
    }

    const body = await request.json();
    const { full_name, email, role, province } = body;

    if (!full_name || typeof full_name !== "string" || !full_name.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Full name is required", 400);
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Email is required", 400);
    }
    const emailNorm = email.trim().toLowerCase();
    const roleVal = (role || "QCTO_REVIEWER").toString();
    if (!QCTO_INVITE_ROLES.includes(roleVal as (typeof QCTO_INVITE_ROLES)[number])) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid role", 400);
    }
    if (ctx.role === "QCTO_SUPER_ADMIN" && roleVal === "QCTO_SUPER_ADMIN") {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        "Only platform administrators can invite QCTO Super Admins.",
        403
      );
    }

    // Check if pending invite already exists for this email
    const existing = await prisma.qCTOInvite.findFirst({
      where: {
        qcto_id: qctoId,
        email: emailNorm,
        status: "PENDING",
      },
    });
    if (existing) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "A pending invite already exists for this email. Revoke it first or use a different email.",
        400
      );
    }

    // Generate secure token
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

    await prisma.qCTOInvite.create({
      data: {
        qcto_id: qctoId,
        email: emailNorm,
        full_name: full_name.trim(),
        role: roleVal as (typeof QCTO_INVITE_ROLES)[number],
        province: province && typeof province === "string" ? province.trim() : null,
        token_hash: tokenHash,
        status: "PENDING",
        expires_at: expiresAt,
        invited_by_user_id: ctx.userId,
      },
    });

    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const acceptUrl = `${base}/auth/qcto/accept-invite?token=${encodeURIComponent(rawToken)}`;

    return Response.json({
      success: true,
      accept_url: acceptUrl,
      message: "Invite created successfully",
    });
  } catch (error) {
    return fail(error);
  }
}

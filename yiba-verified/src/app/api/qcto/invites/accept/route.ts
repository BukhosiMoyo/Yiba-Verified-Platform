// POST /api/qcto/invites/accept - Accept QCTO invite (public, token in body)

import { NextRequest } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { validateProvinceAssignment } from "@/lib/security/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Token is required", 400);
    }

    const tokenHash = createHash("sha256").update(token.trim()).digest("hex");

    const invite = await prisma.qCTOInvite.findFirst({
      where: { token_hash: tokenHash },
      include: { qctoOrg: true },
    });

    if (!invite) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Invalid invite token", 404);
    }
    if (invite.status !== "PENDING") {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "This invite has already been used or revoked", 400);
    }
    if (new Date() > invite.expires_at) {
      await prisma.qCTOInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "This invite has expired", 400);
    }

    const existing = await prisma.user.findFirst({
      where: { email: invite.email, deleted_at: null },
    });

    if (existing) {
      // Validate province assignment for existing user
      // Use province from invite if available, otherwise use existing or body
      const defaultProvince = invite.province || body.default_province || existing.default_province || null;
      let assignedProvinces = body.assigned_provinces || existing.assigned_provinces || [];
      
      // Ensure default_province is included in assigned_provinces
      if (defaultProvince && !assignedProvinces.includes(defaultProvince)) {
        assignedProvinces = [...assignedProvinces, defaultProvince];
      }
      
      validateProvinceAssignment(invite.role, defaultProvince, assignedProvinces);

      await prisma.$transaction([
        prisma.user.update({
          where: { user_id: existing.user_id },
          data: { 
            qcto_id: invite.qcto_id, 
            role: invite.role,
            default_province: defaultProvince,
            assigned_provinces: assignedProvinces,
          },
        }),
        prisma.qCTOInvite.update({
          where: { id: invite.id },
          data: { status: "ACCEPTED", accepted_at: new Date() },
        }),
      ]);
      return ok({
        success: true,
        user_id: existing.user_id,
        email: existing.email,
        role: invite.role,
        existing_user: true,
      });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Password is required (min 8 characters) for new accounts", 400);
    }

    const parts = invite.full_name.trim().split(/\s+/);
    const first_name = parts[0] || "User";
    const last_name = parts.slice(1).join(" ") || "";

    const passwordHash = await bcrypt.hash(password, 10);

    // Validate province assignment for new QCTO user
    // Use province from invite if available, otherwise use body
    const defaultProvince = invite.province || body.default_province || null;
    let assignedProvinces = body.assigned_provinces || [];
    
    // Ensure default_province is included in assigned_provinces
    if (defaultProvince && !assignedProvinces.includes(defaultProvince)) {
      assignedProvinces = [defaultProvince, ...assignedProvinces];
    }
    
    validateProvinceAssignment(invite.role, defaultProvince, assignedProvinces);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: invite.email,
          first_name,
          last_name,
          password_hash: passwordHash,
          role: invite.role,
          qcto_id: invite.qcto_id,
          status: "ACTIVE",
          default_province: defaultProvince,
          assigned_provinces: assignedProvinces,
        },
      });
      await tx.qCTOInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", accepted_at: new Date() },
      });
      return u;
    });

    return ok({
      success: true,
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      existing_user: false,
    });
  } catch (error) {
    return fail(error);
  }
}

// GET /api/qcto/invites/validate?token=... - Validate QCTO invite token (public)

import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token || !token.trim()) {
    return Response.json({ valid: false, reason: "missing_token" }, { status: 200 });
  }

  const tokenHash = createHash("sha256").update(token.trim()).digest("hex");

  const invite = await prisma.qCTOInvite.findFirst({
    where: { token_hash: tokenHash },
  });

  if (!invite) {
    return Response.json({ valid: false, reason: "invalid_token" }, { status: 200 });
  }
  if (invite.status !== "PENDING") {
    return Response.json({ valid: false, reason: invite.status === "ACCEPTED" ? "already_used" : "revoked" }, { status: 200 });
  }
  if (new Date() > invite.expires_at) {
    return Response.json({ valid: false, reason: "expired" }, { status: 200 });
  }

  const existing = await prisma.user.findFirst({
    where: { email: invite.email, deleted_at: null },
  });

  return Response.json({
    valid: true,
    invite: {
      email: invite.email,
      full_name: invite.full_name,
      role: invite.role,
    },
    requires_password: !existing,
  });
}

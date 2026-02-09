// PATCH /api/account/profile - Update current user's first name and last name

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function PATCH(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);
    const body = await request.json();
    const first_name = typeof body.first_name === "string" ? body.first_name.trim() : "";
    const last_name = typeof body.last_name === "string" ? body.last_name.trim() : "";

    if (!first_name || !last_name) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "first_name and last_name are required and must be non-empty",
        400
      );
    }

    // Update user with audit logging
    await prisma.$transaction(async (tx) => {
      // 1. Fetch current data for audit comparison
      const current = await tx.user.findUniqueOrThrow({
        where: { user_id: ctx.userId },
      });

      // 2. Perform update
      await tx.user.update({
        where: { user_id: ctx.userId, deleted_at: null },
        data: { first_name, last_name },
      });

      // 3. Create audit logs for changed fields
      const { createAuditLogs, serializeValue } = await import("@/services/audit.service");
      const auditEntries: any[] = [];

      // Check first_name
      if (first_name !== current.first_name) {
        auditEntries.push({
          entityType: "USER",
          entityId: ctx.userId!,
          fieldName: "first_name",
          oldValue: serializeValue(current.first_name),
          newValue: serializeValue(first_name),
          changedBy: ctx.userId,
          roleAtTime: ctx.role,
          changeType: "UPDATE",
          institutionId: ctx.institutionId,
        });
      }

      // Check last_name
      if (last_name !== current.last_name) {
        auditEntries.push({
          entityType: "USER",
          entityId: ctx.userId!,
          fieldName: "last_name",
          oldValue: serializeValue(current.last_name),
          newValue: serializeValue(last_name),
          changedBy: ctx.userId,
          roleAtTime: ctx.role,
          changeType: "UPDATE",
          institutionId: ctx.institutionId,
        });
      }

      if (auditEntries.length > 0) {
        await createAuditLogs(tx, auditEntries);
      }
    });

    return ok({});
  } catch (err) {
    return fail(err);
  }
}

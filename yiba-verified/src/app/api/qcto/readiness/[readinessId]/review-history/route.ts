import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";
import { assertAssignedOrAdmin } from "@/lib/qctoAssignments";

interface RouteParams {
  params: Promise<{
    readinessId: string;
  }>;
}

/**
 * GET /api/qcto/readiness/[readinessId]/review-history
 * 
 * Returns audit log entries related to a readiness record's review history.
 * Includes status changes, document flags, section reviews, and recommendations.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { readinessId } = await params;

    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can view review history", 403));
    }

    // Verify readiness record exists and is accessible, get institution_id for filtering
    const readiness = await prisma.readiness.findFirst({
      where: {
        readiness_id: readinessId,
        deleted_at: null,
        readiness_status: {
          notIn: ["NOT_STARTED", "IN_PROGRESS"], // QCTO cannot see drafts
        },
      },
      select: {
        readiness_id: true,
        institution_id: true, // Get institution for audit log filtering
      },
    });

    if (!readiness) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Readiness record not found", 404));
    }

    await assertAssignedOrAdmin("READINESS", readinessId, ctx.userId, ctx.role);

    // Fetch audit logs related to this readiness record
    // We need to find logs where:
    // 1. Entity is READINESS with this readiness_id
    // 2. Entity is DOCUMENT linked to this readiness
    // 3. Entity is READINESS_RECOMMENDATION for this readiness
    // AND the log is either:
    // - From the institution that owns this readiness (institution_id matches)
    // - From a QCTO user (institution_id is null for QCTO users)
    const readinessDocuments = await prisma.document.findMany({
      where: {
        related_entity: "READINESS",
        related_entity_id: readinessId,
      },
      select: { document_id: true },
    });
    const documentIds = readinessDocuments.map((d) => d.document_id);

    // Build the entity filter (READINESS + DOCUMENT; AuditEntityType has no READINESS_RECOMMENDATION)
    const entityFilter: Array<{ entity_type: "READINESS"; entity_id: string } | { entity_type: "DOCUMENT"; entity_id: { in: string[] } }> = [
      { entity_type: "READINESS", entity_id: readinessId },
      ...(documentIds.length > 0 ? [{ entity_type: "DOCUMENT" as const, entity_id: { in: documentIds } }] : []),
    ];

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        // Entity must match (READINESS, DOCUMENT, or RECOMMENDATION for this record)
        OR: entityFilter,
        // AND institution filter: only logs from THIS institution OR from QCTO (null institution_id)
        AND: {
          OR: [
            { institution_id: readiness.institution_id }, // Same institution
            { institution_id: null }, // QCTO users (no institution)
          ],
        },
      },
      include: {
        changedBy: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        changed_at: "desc",
      },
      take: 100, // Limit to most recent 100 entries
    });

    // Include role_at_time in response for accurate historical role display
    return NextResponse.json({
      count: auditLogs.length,
      logs: auditLogs.map((log) => ({
        ...log,
        // role_at_time is the role the user had when they made the change
        // This is more accurate than current role for historical display
        user_role: log.role_at_time,
      })),
    });
  } catch (error: any) {
    return fail(error);
  }
}

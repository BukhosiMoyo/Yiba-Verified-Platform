import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/lib/api/mutateWithAudit";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { canAccessQctoData } from "@/lib/rbac";
import { assertAssignedOrAdmin } from "@/lib/qctoAssignments";

interface RouteParams {
  params: Promise<{
    readinessId: string;
    documentId: string;
  }>;
}

interface FlagDocumentBody {
  reason: string;
}

/**
 * POST /api/qcto/readiness/[readinessId]/documents/[documentId]/flag
 * 
 * Flag a document with a reason (QCTO only).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { readinessId, documentId } = await params;

    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can flag documents", 403));
    }

    // Verify readiness record exists and is accessible
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
        institution_id: true,
      },
    });

    if (!readiness) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Readiness record not found", 404));
    }

    await assertAssignedOrAdmin("READINESS", readinessId, ctx.userId, ctx.role);

    // Verify document exists and is linked to this readiness
    const document = await prisma.document.findFirst({
      where: {
        document_id: documentId,
        related_entity: "READINESS",
        related_entity_id: readinessId,
      },
    });

    if (!document) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Document not found or not linked to this readiness record", 404));
    }

    const body: FlagDocumentBody = await request.json();

    if (!body.reason || !body.reason.trim()) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Reason is required", 400));
    }

    // Create document flag
    await mutateWithAudit(ctx, {
      action: "DOCUMENT_FLAG",
      entityType: "DOCUMENT",
      entityId: documentId,
      fn: async (tx) => {
        return await tx.documentFlag.create({
          data: {
            document_id: documentId,
            readiness_id: readinessId,
            flagged_by: ctx.userId,
            reason: body.reason.trim(),
            status: "FLAGGED",
          },
        });
      },
    });

    return NextResponse.json({
      message: "Document flagged successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/qcto/readiness/[readinessId]/documents/[documentId]/flag error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to flag document", 500));
  }
}

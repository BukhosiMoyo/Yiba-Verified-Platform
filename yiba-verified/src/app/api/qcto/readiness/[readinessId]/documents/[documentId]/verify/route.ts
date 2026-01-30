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

/**
 * POST /api/qcto/readiness/[readinessId]/documents/[documentId]/verify
 * 
 * Mark a document as verified/accepted (QCTO only).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { readinessId, documentId } = await params;

    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can verify documents", 403));
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

    // Update document flags to mark as verified
    await mutateWithAudit(ctx, {
      action: "DOCUMENT_VERIFY",
      entityType: "DOCUMENT",
      entityId: documentId,
      fn: async (tx) => {
        // Update any active flags to VERIFIED status
        await tx.documentFlag.updateMany({
          where: {
            document_id: documentId,
            status: "FLAGGED",
          },
          data: {
            status: "VERIFIED",
            resolved_at: new Date(),
          },
        });

        // Update document status to ACCEPTED
        return await tx.document.update({
          where: { document_id: documentId },
          data: { status: "ACCEPTED" },
        });
      },
    });

    return NextResponse.json({
      message: "Document verified successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/qcto/readiness/[readinessId]/documents/[documentId]/verify error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to verify document", 500));
  }
}

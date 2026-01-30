import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/lib/api/mutateWithAudit";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { canAccessQctoData } from "@/lib/rbac";
import { Notifications } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{
    documentId: string;
  }>;
}

/**
 * POST /api/qcto/documents/[documentId]/flag
 * 
 * Flag a document for review (QCTO only).
 * This allows QCTO to mark documents that need attention.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { documentId } = await params;

    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can flag documents", 403));
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Reason is required", 400));
    }

    // Find document (QCTO can see documents linked to submissions they can access)
    const document = await prisma.document.findFirst({
      where: { document_id: documentId },
    });

    if (!document) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Document not found", 404));
    }

    // Create flag
    const flag = await mutateWithAudit(ctx, {
      action: "DOCUMENT_FLAG",
      entityType: "DOCUMENT",
      entityId: documentId,
      fn: async (tx) => {
        // Create flag
        const newFlag = await tx.evidenceFlag.create({
          data: {
            document_id: documentId,
            flagged_by: ctx.userId,
            reason: reason.trim(),
            status: "ACTIVE",
          },
        });

        // Update document status to FLAGGED if currently UPLOADED
        await tx.document.update({
          where: { document_id: documentId },
          data: {
            status: document.status === "UPLOADED" ? "FLAGGED" : document.status,
          },
        });

        return newFlag;
      },
    });

    // Notify document owner (uploader)
    await Notifications.documentFlagged(document.uploaded_by, documentId);

    return NextResponse.json({
      flag_id: flag.flag_id,
      document_id: flag.document_id,
      reason: flag.reason,
      status: flag.status,
      flagged_by: flag.flagged_by,
      created_at: flag.created_at.toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/qcto/documents/[documentId]/flag error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to flag document", 500));
  }
}

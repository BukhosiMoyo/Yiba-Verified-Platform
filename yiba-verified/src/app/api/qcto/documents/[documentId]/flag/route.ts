import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/lib/api/mutateWithAudit";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";

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

    // Only QCTO_USER and PLATFORM_ADMIN can flag documents
    if (ctx.role !== "QCTO_USER" && ctx.role !== "PLATFORM_ADMIN") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO users can flag documents", 403));
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
      fn: async () => {
        // Create flag
        const newFlag = await prisma.evidenceFlag.create({
          data: {
            document_id: documentId,
            flagged_by: ctx.userId,
            reason: reason.trim(),
            status: "ACTIVE",
          },
        });

        // Update document status to FLAGGED if currently UPLOADED
        await prisma.document.update({
          where: { document_id: documentId },
          data: {
            status: document.status === "UPLOADED" ? "FLAGGED" : document.status,
          },
        });

        return newFlag;
      },
    });

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

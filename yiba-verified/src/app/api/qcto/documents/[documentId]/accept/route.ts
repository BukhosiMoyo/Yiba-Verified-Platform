import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/lib/api/mutateWithAudit";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { canAccessQctoData } from "@/lib/rbac";
import { validateRouteParamUUID } from "@/lib/security/validation";
import { applyRateLimit, RATE_LIMITS, enforceRequestSizeLimit } from "@/lib/api/routeHelpers";

interface RouteParams {
  params: Promise<{
    documentId: string;
  }>;
}

/**
 * POST /api/qcto/documents/[documentId]/accept
 * 
 * Accept a document (QCTO only).
 * This marks the document as accepted and resolves any active flags.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Enforce request size limit
    await enforceRequestSizeLimit(request);
    
    const ctx = await requireApiContext(request);
    
    // Apply rate limiting
    const rateLimitHeaders = applyRateLimit(request, RATE_LIMITS.STANDARD, ctx.userId);
    
    const { documentId: rawDocumentId } = await params;
    const documentId = validateRouteParamUUID(rawDocumentId, "documentId");

    if (!canAccessQctoData(ctx.role)) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can accept documents", 403));
    }

    // Find document
    const document = await prisma.document.findFirst({
      where: { document_id: documentId },
      include: {
        flags: {
          where: { status: "ACTIVE" },
        },
      },
    });

    if (!document) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Document not found", 404));
    }

    // Accept document and resolve all active flags
    await mutateWithAudit(ctx, {
      action: "DOCUMENT_ACCEPT",
      entityType: "DOCUMENT",
      entityId: documentId,
      fn: async (tx) => {
        // Update document status to ACCEPTED
        await tx.document.update({
          where: { document_id: documentId },
          data: { status: "ACCEPTED" },
        });

        // Resolve all active flags
        if (document.flags.length > 0) {
          await tx.evidenceFlag.updateMany({
            where: {
              document_id: documentId,
              status: "ACTIVE",
            },
            data: {
              status: "RESOLVED",
              resolved_at: new Date(),
              resolved_by: ctx.userId,
            },
          });
        }

        return document;
      },
    });

    return NextResponse.json(
      {
        document_id: document.document_id,
        status: "ACCEPTED",
        message: "Document accepted and all flags resolved",
      },
      {
        status: 200,
        headers: rateLimitHeaders,
      }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error);
    }
    console.error("POST /api/qcto/documents/[documentId]/accept error:", error);
    return fail(new AppError(ERROR_CODES.INTERNAL_ERROR, "Failed to accept document", 500));
  }
}

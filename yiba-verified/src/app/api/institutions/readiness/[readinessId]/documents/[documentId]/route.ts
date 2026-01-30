import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{
    readinessId: string;
    documentId: string;
  }>;
}

/**
 * DELETE /api/institutions/readiness/[readinessId]/documents/[documentId]
 *
 * Remove a document from a readiness record (deletes the document record).
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { ctx } = await requireAuth(request);
    const { readinessId, documentId } = await params;

    // RBAC: Institution roles and PLATFORM_ADMIN can remove documents
    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions to remove documents", 403);
    }

    // Verify readiness record exists and user has access
    const readiness = await prisma.readiness.findFirst({
      where: {
        readiness_id: readinessId,
        deleted_at: null,
      },
      select: {
        readiness_id: true,
        institution_id: true,
        readiness_status: true,
      },
    });

    if (!readiness) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Readiness record not found", 404);
    }

    // Institution scoping
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (readiness.institution_id !== ctx.institutionId) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Access denied: Readiness record belongs to another institution",
          403
        );
      }
      // Institution users can only remove if record is editable
      if (readiness.readiness_status !== "NOT_STARTED" && readiness.readiness_status !== "IN_PROGRESS") {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Cannot remove documents: Readiness record is not in editable status",
          403
        );
      }
    }

    // Verify document exists and is linked to this readiness
    const document = await prisma.document.findFirst({
      where: {
        document_id: documentId,
        related_entity: "READINESS",
        related_entity_id: readinessId,
      },
    });

    if (!document) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Document not found or not linked to this readiness record", 404);
    }

    await prisma.document.delete({
      where: { document_id: documentId },
    });

    return NextResponse.json({
      message: "Document removed successfully",
    });
  } catch (error: any) {
    return fail(error);
  }
}

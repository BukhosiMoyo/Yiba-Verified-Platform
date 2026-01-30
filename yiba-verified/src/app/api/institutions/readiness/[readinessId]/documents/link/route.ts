import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/lib/api/mutateWithAudit";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{
    readinessId: string;
  }>;
}

interface LinkDocumentBody {
  document_id: string;
  section_name?: string;
  criterion_key?: string;
}

/**
 * POST /api/institutions/readiness/[readinessId]/documents/link
 * 
 * Link an existing document from the vault to a readiness record.
 * Used when selecting documents from the vault.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { ctx } = await requireAuth(request);
    const { readinessId } = await params;

    // RBAC: Institution roles and PLATFORM_ADMIN can link documents
    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions to link documents", 403);
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
      // Institution users can only link if record is editable
      if (readiness.readiness_status !== "NOT_STARTED" && readiness.readiness_status !== "IN_PROGRESS") {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Cannot link documents: Readiness record is not in editable status",
          403
        );
      }
    }

    const body: LinkDocumentBody = await request.json();

    if (!body.document_id) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "document_id is required", 400);
    }

    // Verify document exists and belongs to the same institution
    const document = await prisma.document.findFirst({
      where: {
        document_id: body.document_id,
      },
    });

    if (!document) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Document not found", 404);
    }

    // Verify document belongs to the same institution
    if (document.related_entity === "INSTITUTION") {
      if (document.related_entity_id !== readiness.institution_id) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Document belongs to a different institution",
          403
        );
      }
    }

    // Create a new document record linked to the readiness (copy reference)
    // In a real implementation, you might want to create a link table instead
    // For now, we'll create a new document record that references the original
    await mutateWithAudit(ctx, {
      action: "DOCUMENT_LINK",
      entityType: "DOCUMENT",
      entityId: body.document_id,
      fn: async (tx) => {
        // Get latest version
        const latestVersion = await tx.document.findFirst({
          where: {
            related_entity: "READINESS",
            related_entity_id: readinessId,
            document_type: document.document_type,
          },
          orderBy: { version: "desc" },
          select: { version: true },
        });

        const newVersion = (latestVersion?.version || 0) + 1;

        // Create new document record linked to readiness
        return await tx.document.create({
          data: {
            related_entity: "READINESS",
            related_entity_id: readinessId,
            document_type: document.document_type,
            file_name: document.file_name,
            version: newVersion,
            uploaded_by: ctx.userId,
            mime_type: document.mime_type,
            file_size_bytes: document.file_size_bytes,
            status: "UPLOADED",
            storage_key: document.storage_key, // Reference same file
          },
        });
      },
    });

    return NextResponse.json({
      message: "Document linked successfully",
    });
  } catch (error: any) {
    return fail(error);
  }
}

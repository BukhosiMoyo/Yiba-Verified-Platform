import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/lib/api/mutateWithAudit";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { getStorageService } from "@/lib/storage";
import { validateRouteParamUUID } from "@/lib/security/validation";

interface RouteParams {
  params: Promise<{
    documentId: string;
  }>;
}

/**
 * GET /api/institutions/documents/[documentId]
 * 
 * Get document details including version history.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { documentId: rawDocumentId } = await params;
    
    // Validate UUID format to prevent invalid IDs from reaching the database
    const documentId = validateRouteParamUUID(rawDocumentId, "documentId");

    // Build where clause with institution scoping
    const where: any = {
      document_id: documentId,
    };

    // Enforce institution scoping rules
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId) {
        return fail(new AppError(ERROR_CODES.UNAUTHENTICATED, "Unauthorized: Institution context required", 401));
      }
      where.OR = [
        { related_entity: "INSTITUTION", related_entity_id: ctx.institutionId },
        { related_entity: "LEARNER", learner: { institution_id: ctx.institutionId } },
        { related_entity: "ENROLMENT", enrolment: { institution_id: ctx.institutionId } },
        { related_entity: "READINESS", readiness: { institution_id: ctx.institutionId } },
      ];
    }

    const document = await prisma.document.findFirst({
      where,
      include: {
        uploadedByUser: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        flags: {
          include: {
            flaggedByUser: {
              select: {
                user_id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
            resolvedByUser: {
              select: {
                user_id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!document) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Document not found", 404));
    }

    // Get all versions of this document (same related_entity + related_entity_id + document_type)
    const versions = await prisma.document.findMany({
      where: {
        related_entity: document.related_entity,
        related_entity_id: document.related_entity_id,
        document_type: document.document_type,
      },
      include: {
        uploadedByUser: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { version: "desc" },
    });

    return NextResponse.json({
      document_id: document.document_id,
      related_entity: document.related_entity,
      related_entity_id: document.related_entity_id,
      document_type: document.document_type,
      file_name: document.file_name,
      version: document.version,
      status: document.status,
      uploaded_by: document.uploaded_by,
      uploaded_at: document.uploaded_at.toISOString(),
      storage_key: document.storage_key,
      mime_type: document.mime_type,
      file_size_bytes: document.file_size_bytes,
      uploadedBy: {
        user_id: document.uploadedByUser.user_id,
        email: document.uploadedByUser.email,
        name: document.uploadedByUser.first_name && document.uploadedByUser.last_name
          ? `${document.uploadedByUser.first_name} ${document.uploadedByUser.last_name}`
          : document.uploadedByUser.email,
      },
      flags: document.flags.map((flag) => ({
        flag_id: flag.flag_id,
        reason: flag.reason,
        status: flag.status,
        flagged_by: flag.flagged_by,
        flaggedBy: {
          user_id: flag.flaggedByUser.user_id,
          email: flag.flaggedByUser.email,
          name: flag.flaggedByUser.first_name && flag.flaggedByUser.last_name
            ? `${flag.flaggedByUser.first_name} ${flag.flaggedByUser.last_name}`
            : flag.flaggedByUser.email,
        },
        resolved_by: flag.resolved_by,
        resolvedBy: flag.resolvedByUser ? {
          user_id: flag.resolvedByUser.user_id,
          email: flag.resolvedByUser.email,
          name: flag.resolvedByUser.first_name && flag.resolvedByUser.last_name
            ? `${flag.resolvedByUser.first_name} ${flag.resolvedByUser.last_name}`
            : flag.resolvedByUser.email,
        } : null,
        created_at: flag.created_at.toISOString(),
        resolved_at: flag.resolved_at?.toISOString() || null,
      })),
      versions: versions.map((v) => ({
        document_id: v.document_id,
        version: v.version,
        file_name: v.file_name,
        status: v.status,
        uploaded_by: v.uploaded_by,
        uploaded_at: v.uploaded_at.toISOString(),
        storage_key: v.storage_key,
        mime_type: v.mime_type,
        file_size_bytes: v.file_size_bytes,
        uploadedBy: {
          user_id: v.uploadedByUser.user_id,
          email: v.uploadedByUser.email,
          name: v.uploadedByUser.first_name && v.uploadedByUser.last_name
            ? `${v.uploadedByUser.first_name} ${v.uploadedByUser.last_name}`
            : v.uploadedByUser.email,
        },
        isCurrentVersion: v.document_id === document.document_id,
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * PATCH /api/institutions/documents/[documentId]
 * 
 * Replace document with a new version.
 * This creates a new document record with incremented version number.
 * Original document is NOT deleted (no deletions per rules).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { documentId } = await params;

    // Only INSTITUTION_* roles can replace documents
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only institution users can replace documents", 403));
    }

    if (!ctx.institutionId) {
      return fail(new AppError(ERROR_CODES.UNAUTHENTICATED, "Institution context required", 401));
    }

    // Find current document
    const currentDoc = await prisma.document.findFirst({
      where: {
        document_id: documentId,
        OR: [
          { related_entity: "INSTITUTION", related_entity_id: ctx.institutionId },
          { related_entity: "LEARNER", learner: { institution_id: ctx.institutionId } },
          { related_entity: "ENROLMENT", enrolment: { institution_id: ctx.institutionId } },
          { related_entity: "READINESS", readiness: { institution_id: ctx.institutionId } },
        ],
      },
    });

    if (!currentDoc) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Document not found or access denied", 404));
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "File is required for replacement", 400));
    }

    // Get file metadata
    const fileSize = file.size;
    const mimeType = file.type || "application/octet-stream";
    const fileName = file.name;

    // Generate storage key for new version
    const timestamp = Date.now();
    const storageKey = `${currentDoc.related_entity}/${currentDoc.related_entity_id}/${currentDoc.document_type}/${timestamp}-${fileName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload file to storage (S3 or local filesystem)
    const storage = getStorageService();
    await storage.upload(buffer, storageKey, mimeType);

    // Find max version to increment
    const maxVersion = await prisma.document.findFirst({
      where: {
        related_entity: currentDoc.related_entity,
        related_entity_id: currentDoc.related_entity_id,
        document_type: currentDoc.document_type,
      },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const newVersion = (maxVersion?.version || currentDoc.version) + 1;

    // Create new document version
    const newDocument = await mutateWithAudit(ctx, {
      action: "DOCUMENT_REPLACE",
      entityType: "DOCUMENT",
      entityId: () => "", // Will be set after creation
      fn: async (tx) => {
        return await tx.document.create({
          data: {
            related_entity: currentDoc.related_entity,
            related_entity_id: currentDoc.related_entity_id,
            document_type: currentDoc.document_type,
            file_name: fileName,
            version: newVersion,
            status: "UPLOADED",
            uploaded_by: ctx.userId,
            storage_key: storageKey,
            mime_type: mimeType,
            file_size_bytes: fileSize,
          },
        });
      },
    });

    return NextResponse.json({
      document_id: newDocument.document_id,
      related_entity: newDocument.related_entity,
      related_entity_id: newDocument.related_entity_id,
      document_type: newDocument.document_type,
      file_name: newDocument.file_name,
      version: newDocument.version,
      status: newDocument.status,
      uploaded_at: newDocument.uploaded_at.toISOString(),
      storage_key: newDocument.storage_key,
      mime_type: newDocument.mime_type,
      file_size_bytes: newDocument.file_size_bytes,
      replaced_document_id: documentId,
    });
  } catch (error) {
    return fail(error);
  }
}

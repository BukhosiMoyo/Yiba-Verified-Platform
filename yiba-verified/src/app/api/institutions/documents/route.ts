import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/lib/api/mutateWithAudit";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { getStorageService } from "@/lib/storage";

/**
 * GET /api/institutions/documents
 * 
 * List documents with filters.
 * - INSTITUTION_*: See documents from their institution
 * - PLATFORM_ADMIN: See all documents (app owners see everything! 🦸)
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);
    const searchParams = request.nextUrl.searchParams;

    // Build where clause with institution scoping
    const where: any = {
      // Only non-deleted documents (soft delete via status not used, but we'll check anyway)
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
    // PLATFORM_ADMIN can see ALL documents (no institution scoping - app owners see everything!)

    // Filters
    const relatedEntity = searchParams.get("related_entity");
    if (relatedEntity) {
      where.related_entity = relatedEntity;
    }

    const relatedEntityId = searchParams.get("related_entity_id");
    if (relatedEntityId) {
      where.related_entity_id = relatedEntityId;
    }

    const documentType = searchParams.get("document_type");
    if (documentType) {
      where.document_type = { contains: documentType, mode: "insensitive" };
    }

    const status = searchParams.get("status");
    if (status) {
      where.status = status;
    }

    const q = searchParams.get("q");
    if (q) {
      where.OR = [
        { file_name: { contains: q, mode: "insensitive" } },
        { document_type: { contains: q, mode: "insensitive" } },
      ];
    }

    // Pagination
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    const [documents, totalCount] = await Promise.all([
      prisma.document.findMany({
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
            where: { status: "ACTIVE" },
            include: {
              flaggedByUser: {
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
          _count: {
            select: {
              flags: true,
            },
          },
        },
        orderBy: { uploaded_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      count: totalCount,
      items: documents.map((doc) => ({
        document_id: doc.document_id,
        related_entity: doc.related_entity,
        related_entity_id: doc.related_entity_id,
        document_type: doc.document_type,
        file_name: doc.file_name,
        version: doc.version,
        status: doc.status,
        uploaded_by: doc.uploaded_by,
        uploaded_at: doc.uploaded_at.toISOString(),
        storage_key: doc.storage_key,
        mime_type: doc.mime_type,
        file_size_bytes: doc.file_size_bytes,
        uploadedBy: {
          user_id: doc.uploadedByUser.user_id,
          email: doc.uploadedByUser.email,
          name: doc.uploadedByUser.first_name && doc.uploadedByUser.last_name
            ? `${doc.uploadedByUser.first_name} ${doc.uploadedByUser.last_name}`
            : doc.uploadedByUser.email,
        },
        activeFlagsCount: doc._count.flags,
        activeFlags: doc.flags.map((flag) => ({
          flag_id: flag.flag_id,
          reason: flag.reason,
          flagged_by: flag.flagged_by,
          flaggedBy: {
            user_id: flag.flaggedByUser.user_id,
            email: flag.flaggedByUser.email,
            name: flag.flaggedByUser.first_name && flag.flaggedByUser.last_name
              ? `${flag.flaggedByUser.first_name} ${flag.flaggedByUser.last_name}`
              : flag.flaggedByUser.email,
          },
          created_at: flag.created_at.toISOString(),
        })),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

/**
 * POST /api/institutions/documents
 * 
 * Upload a new document.
 * For MVP, we'll accept multipart/form-data with file and metadata.
 * In production, this should integrate with S3 or similar storage.
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireApiContext(request);

    // Only INSTITUTION_* roles can upload documents
    if (ctx.role !== "INSTITUTION_ADMIN" && ctx.role !== "INSTITUTION_STAFF") {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Only institution users can upload documents", 403));
    }

    if (!ctx.institutionId) {
      return fail(new AppError(ERROR_CODES.UNAUTHENTICATED, "Institution context required", 401));
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const relatedEntity = formData.get("related_entity") as string | null;
    let relatedEntityId = formData.get("related_entity_id") as string | null;
    const documentType = formData.get("document_type") as string | null;

    if (!file) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "File is required", 400));
    }

    if (!relatedEntity || !documentType) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "related_entity and document_type are required", 400));
    }

    // For INSTITUTION entity, use the user's institution_id from session
    if (relatedEntity === "INSTITUTION") {
      if (!ctx.institutionId) {
        return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Institution context required for INSTITUTION documents", 400));
      }
      relatedEntityId = ctx.institutionId;
    } else if (!relatedEntityId) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "related_entity_id is required for this entity type", 400));
    }

    // Validate related entity exists and belongs to institution
    let entityExists = false;
    switch (relatedEntity) {
      case "INSTITUTION":
        entityExists = !!(await prisma.institution.findFirst({
          where: { institution_id: relatedEntityId, deleted_at: null },
        }));
        break;
      case "LEARNER":
        const learner = await prisma.learner.findFirst({
          where: { learner_id: relatedEntityId, deleted_at: null },
        });
        if (!learner || learner.institution_id !== ctx.institutionId) {
          return fail(new AppError(ERROR_CODES.NOT_FOUND, "Learner not found or access denied", 404));
        }
        entityExists = true;
        break;
      case "ENROLMENT":
        const enrolment = await prisma.enrolment.findFirst({
          where: { enrolment_id: relatedEntityId, deleted_at: null },
          include: { learner: true },
        });
        if (!enrolment || enrolment.learner.institution_id !== ctx.institutionId) {
          return fail(new AppError(ERROR_CODES.NOT_FOUND, "Enrolment not found or access denied", 404));
        }
        entityExists = true;
        break;
      case "READINESS":
        const readiness = await prisma.readiness.findFirst({
          where: { readiness_id: relatedEntityId, deleted_at: null },
        });
        if (!readiness || readiness.institution_id !== ctx.institutionId) {
          return fail(new AppError(ERROR_CODES.NOT_FOUND, "Readiness record not found or access denied", 404));
        }
        entityExists = true;
        break;
      default:
        return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid related_entity", 400));
    }

    if (!entityExists) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Related entity not found", 404));
    }

    // Get file metadata
    const fileSize = file.size;
    const mimeType = file.type || "application/octet-stream";
    const fileName = file.name;

    // Generate storage key
    // Format: {related_entity}/{related_entity_id}/{document_type}/{timestamp}-{filename}
    const timestamp = Date.now();
    const storageKey = `${relatedEntity}/${relatedEntityId}/${documentType}/${timestamp}-${fileName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload file to storage (S3 or local filesystem)
    const storage = getStorageService();
    await storage.upload(buffer, storageKey, mimeType);

    // Create document record with version 1
    const document = await mutateWithAudit(ctx, {
      action: "DOCUMENT_CREATE",
      entityType: "DOCUMENT",
      entityId: () => "", // Will be set after creation
      fn: async () => {
        return await prisma.document.create({
          data: {
            related_entity: relatedEntity as any,
            related_entity_id: relatedEntityId,
            document_type: documentType,
            file_name: fileName,
            version: 1,
            status: "UPLOADED",
            uploaded_by: ctx.userId,
            storage_key: storageKey,
            mime_type: mimeType,
            file_size_bytes: fileSize,
          },
        });
      },
    });

    return NextResponse.json(
      {
        document_id: document.document_id,
        related_entity: document.related_entity,
        related_entity_id: document.related_entity_id,
        document_type: document.document_type,
        file_name: document.file_name,
        version: document.version,
        status: document.status,
        uploaded_at: document.uploaded_at.toISOString(),
        storage_key: document.storage_key,
        mime_type: document.mime_type,
        file_size_bytes: document.file_size_bytes,
      },
      { status: 201 }
    );
  } catch (error) {
    return fail(error);
  }
}

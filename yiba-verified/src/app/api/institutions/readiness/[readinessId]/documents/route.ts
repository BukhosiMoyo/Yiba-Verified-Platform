import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/lib/api/mutateWithAudit";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getStorageService } from "@/lib/storage";

interface RouteParams {
  params: Promise<{
    readinessId: string;
  }>;
}

/**
 * POST /api/institutions/readiness/[readinessId]/documents
 * 
 * Upload a new document and link it to a readiness record.
 * Supports inline uploads during form completion.
 * 
 * FormData:
 *   file: File (required)
 *   document_type: string (optional)
 *   section_name: string (optional) - Form 5 section name
 *   criterion_key: string (optional) - Specific criterion within section
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { ctx } = await requireAuth(request);
    const { readinessId } = await params;

    // RBAC: Institution roles and PLATFORM_ADMIN can upload
    const allowedRoles = ["INSTITUTION_ADMIN", "INSTITUTION_STAFF", "PLATFORM_ADMIN"];
    if (!allowedRoles.includes(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Insufficient permissions to upload documents", 403);
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
      // Institution users can only upload if record is editable
      if (readiness.readiness_status !== "NOT_STARTED" && readiness.readiness_status !== "IN_PROGRESS") {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          "Cannot upload documents: Readiness record is not in editable status",
          403
        );
      }
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "File is required", 400);
    }

    // Validate file size (10MB limit)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "File size exceeds 10MB limit", 400);
    }

    const documentType = (formData.get("document_type") as string) || "READINESS_EVIDENCE";
    const sectionName = formData.get("section_name") as string | null;
    const criterionKey = formData.get("criterion_key") as string | null;
    const suggestedFileName = formData.get("suggested_file_name") as string | null;


    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate storage key
    // Format: READINESS/{readinessId}/{document_type}/{timestamp}-{filename}
    const timestamp = Date.now();
    const storageKey = `READINESS/${readinessId}/${documentType}/${timestamp}-${file.name}`;

    // Upload using storage service
    const storage = getStorageService();
    const mimeType = file.type || "application/octet-stream";
    await storage.upload(buffer, storageKey, mimeType);

    const document = await mutateWithAudit(ctx, {
      action: "DOCUMENT_CREATE",
      entityType: "DOCUMENT",
      entityId: readinessId,
      fn: async (tx) => {
        // Get latest version for this document type
        const latestVersion = await tx.document.findFirst({
          where: {
            related_entity: "READINESS",
            related_entity_id: readinessId,
            document_type: documentType,
          },
          orderBy: { version: "desc" },
          select: { version: true },
        });

        const newVersion = (latestVersion?.version || 0) + 1;

        return await tx.document.create({
          data: {
            related_entity: "READINESS",
            related_entity_id: readinessId,
            document_type: documentType,
            file_name: suggestedFileName || file.name,
            version: newVersion,
            uploaded_by: ctx.userId,
            mime_type: file.type || null,
            file_size_bytes: file.size,
            status: "UPLOADED",
            // Store section metadata (if schema supports it, otherwise use a JSON field or separate table)
            // For now, we'll store in a way that can be queried
            storage_key: storageKey,
          },
        });
      },
    });

    return NextResponse.json({
      document_id: document.document_id,
      file_name: document.file_name,
      message: "Document uploaded successfully",
    });
  } catch (error: any) {
    return fail(error);
  }
}

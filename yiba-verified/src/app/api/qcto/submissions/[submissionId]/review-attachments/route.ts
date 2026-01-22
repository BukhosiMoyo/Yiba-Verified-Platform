// POST /api/qcto/submissions/[submissionId]/review-attachments
// Upload a file to attach to the review notes. QCTO_USER and PLATFORM_ADMIN only.
// Submission must be SUBMITTED or UNDER_REVIEW.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getStorageService } from "@/lib/storage";
import { canAccessQctoData } from "@/lib/rbac";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can add review attachments", 403);
    }

    const { submissionId } = await params;

    const submission = await prisma.submission.findUnique({
      where: { submission_id: submissionId, deleted_at: null },
      select: { submission_id: true, status: true },
    });
    if (!submission) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Submission not found", 404);
    }
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Can only add review attachments to SUBMITTED or UNDER_REVIEW submissions",
        400
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "File is required", 400);
    }

    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "File must be 10 MB or smaller", 400);
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const mime = file.type || "application/octet-stream";
    const allowed = allowedTypes.includes(mime) || mime.startsWith("image/");
    if (!allowed) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Allowed types: PDF, images (JPEG, PNG, GIF, WebP), Word (DOC, DOCX)",
        400
      );
    }

    const fileName = file.name || "attachment";
    const timestamp = Date.now();
    const storageKey = `submission-review-attachments/${submissionId}/${timestamp}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storage = getStorageService();
    await storage.upload(buffer, storageKey, mime);

    const attachment = await prisma.submissionReviewAttachment.create({
      data: {
        submission_id: submissionId,
        file_name: fileName,
        storage_key: storageKey,
        mime_type: mime,
        file_size_bytes: file.size,
        uploaded_by: ctx.userId,
      },
    });

    return NextResponse.json(
      {
        attachment_id: attachment.attachment_id,
        file_name: attachment.file_name,
        mime_type: attachment.mime_type,
        file_size_bytes: attachment.file_size_bytes,
        uploaded_at: attachment.uploaded_at.toISOString(),
      },
      { status: 201 }
    );
  } catch (e) {
    return fail(e);
  }
}

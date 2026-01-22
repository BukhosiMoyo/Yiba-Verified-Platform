// DELETE /api/qcto/submissions/[submissionId]/review-attachments/[attachmentId]
// Remove a review attachment. QCTO_USER and PLATFORM_ADMIN only.
// Submission must be SUBMITTED or UNDER_REVIEW.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getStorageService } from "@/lib/storage";
import { canAccessQctoData } from "@/lib/rbac";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string; attachmentId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can remove review attachments", 403);
    }

    const { submissionId, attachmentId } = await params;

    const attachment = await prisma.submissionReviewAttachment.findFirst({
      where: { attachment_id: attachmentId, submission_id: submissionId },
      include: {
        submission: { select: { status: true, deleted_at: true } },
      },
    });

    if (!attachment) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Attachment not found", 404);
    }
    if (attachment.submission.deleted_at) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Submission not found", 404);
    }
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(attachment.submission.status)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        "Can only remove attachments from SUBMITTED or UNDER_REVIEW submissions",
        400
      );
    }

    const storage = getStorageService();
    try {
      await storage.delete(attachment.storage_key);
    } catch {
      // ignore storage delete errors, still remove DB record
    }

    await prisma.submissionReviewAttachment.delete({
      where: { attachment_id: attachmentId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return fail(e);
  }
}

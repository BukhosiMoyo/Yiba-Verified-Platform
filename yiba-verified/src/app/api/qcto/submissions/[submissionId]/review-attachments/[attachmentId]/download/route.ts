// GET /api/qcto/submissions/[submissionId]/review-attachments/[attachmentId]/download
// Download a review attachment. QCTO_USER and PLATFORM_ADMIN only.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getStorageService } from "@/lib/storage";
import { Readable } from "stream";
import { canAccessQctoData } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string; attachmentId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    if (!canAccessQctoData(ctx.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, "Only QCTO and platform administrators can download review attachments", 403);
    }

    const { submissionId, attachmentId } = await params;

    const attachment = await prisma.submissionReviewAttachment.findFirst({
      where: { attachment_id: attachmentId, submission_id: submissionId },
    });

    if (!attachment) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Attachment not found", 404);
    }

    const storage = getStorageService();
    const downloadResult = await storage.download(attachment.storage_key);
    const stream = downloadResult.stream;

    const inline = request.nextUrl.searchParams.get("inline") === "1";

    if (stream instanceof Readable) {
      const responseStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              controller.enqueue(new Uint8Array(chunk));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new NextResponse(responseStream, {
        headers: {
          "Content-Type": downloadResult.contentType,
          "Content-Disposition": inline
            ? `inline; filename="${attachment.file_name}"`
            : `attachment; filename="${attachment.file_name}"`,
          "Content-Length": downloadResult.contentLength.toString(),
        },
      });
    }

    return new NextResponse(stream as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": downloadResult.contentType,
        "Content-Disposition": inline
          ? `inline; filename="${attachment.file_name}"`
          : `attachment; filename="${attachment.file_name}"`,
        "Content-Length": downloadResult.contentLength.toString(),
      },
    });
  } catch (e) {
    return fail(e);
  }
}

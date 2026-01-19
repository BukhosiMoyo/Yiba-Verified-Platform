import { NextRequest, NextResponse } from "next/server";
import { requireApiContext } from "@/lib/api/context";
import { prisma } from "@/lib/prisma";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { fail } from "@/lib/api/response";
import { getStorageService } from "@/lib/storage";
import { Readable } from "stream";

interface RouteParams {
  params: Promise<{
    documentId: string;
  }>;
}

/**
 * GET /api/institutions/documents/[documentId]/download
 * 
 * Download a document file.
 * - Enforces institution scoping (users can only download their institution's documents)
 * - Streams the file from storage (S3 or local filesystem)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiContext(request);
    const { documentId } = await params;

    // Build where clause with institution scoping
    const where: any = {
      document_id: documentId,
    };

    // Enforce institution scoping rules
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId) {
        return fail(new AppError(ERROR_CODES.UNAUTHENTICATED, "Institution context required", 401));
      }
      where.OR = [
        { related_entity: "INSTITUTION", related_entity_id: ctx.institutionId },
        { related_entity: "LEARNER", learner: { institution_id: ctx.institutionId } },
        { related_entity: "ENROLMENT", enrolment: { institution_id: ctx.institutionId } },
        { related_entity: "READINESS", readiness: { institution_id: ctx.institutionId } },
      ];
    }
    // PLATFORM_ADMIN can access all documents

    // Find document
    const document = await prisma.document.findFirst({
      where,
      select: {
        document_id: true,
        storage_key: true,
        file_name: true,
        mime_type: true,
        file_size_bytes: true,
      },
    });

    if (!document) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Document not found", 404));
    }

    // inline=1: show in browser (e.g. PDF quick view) instead of attachment
    const inline = request.nextUrl.searchParams.get("inline") === "1";

    // Download file from storage
    const storage = getStorageService();
    const downloadResult = await storage.download(document.storage_key);

    // Convert Readable stream to Response
    // For Next.js, we need to convert the stream to a Response
    const stream = downloadResult.stream;
    
    // If it's a Node.js Readable stream, we can use it directly
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
          "Content-Disposition": inline ? `inline; filename="${document.file_name}"` : `attachment; filename="${document.file_name}"`,
          "Content-Length": downloadResult.contentLength.toString(),
        },
      });
    }

    // If it's already a ReadableStream
    return new NextResponse(stream as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": downloadResult.contentType,
        "Content-Disposition": inline ? `inline; filename="${document.file_name}"` : `attachment; filename="${document.file_name}"`,
        "Content-Length": downloadResult.contentLength.toString(),
      },
    });
  } catch (error) {
    return fail(error);
  }
}

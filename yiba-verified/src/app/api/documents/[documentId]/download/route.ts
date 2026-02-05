
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageService } from "@/lib/storage";
import { Readable } from "stream";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { documentId } = await params;

    try {
        const document = await prisma.document.findUnique({
            where: { document_id: documentId },
        });

        if (!document) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Access Control Logic
        const user = session.user;
        const isPlatformAdmin = user.role === "PLATFORM_ADMIN";
        const isQctoUser = ["QCTO_ADMIN", "QCTO_SUPER_ADMIN", "QCTO_USER", "QCTO_REVIEWER"].includes(user.role);
        const isOwner = document.uploaded_by === user.userId;

        // Institution checks
        // If document is linked to Institution, verify user belongs to it
        // Wait, Document has `institution_id` relation?
        // Looking at schema from Step 270:
        // related_entity_id, related_entity enum.
        // AND `institution Institution? @relation(fields: [related_entity_id]...`

        let hasAccess = isPlatformAdmin || isQctoUser || isOwner;

        if (!hasAccess && document.related_entity_id) {
            // If user is institution staff/admin, check if they belong to the related institution
            if (user.institutionId) {
                // Check if document is owned by/related to this institution
                // If related_entity is "INSTITUTION" or we can infer it.
                // Or if `uploadedByUser` belongs to same institution?
                // Safer: Check if related_entity_id matches user.institutionId (if entity is Institution)
                // Or if we check strict ownership.

                // For now, if user is in same institution as uploader?
                // Or if document is linked to user's institution.

                // If document is linked to an institution via `related_entity`
                if (document.related_entity === "INSTITUTION" && document.related_entity_id === user.institutionId) {
                    hasAccess = true;
                }

                // If document is linked to something else (e.g. Learner), complex check needed.
                // But for Evidence Vault, they are linked to Institution usually?
                // Or uploaded by Institution User.

                // Check uploader's institution
                if (!hasAccess) {
                    const uploader = await prisma.user.findUnique({
                        where: { user_id: document.uploaded_by },
                        select: { institution_id: true }
                    });
                    if (uploader && uploader.institution_id === user.institutionId) {
                        hasAccess = true;
                    }
                }
            }
        }

        if (!hasAccess) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Get Storage URL
        if (!document.storage_key) {
            return new NextResponse("File content missing", { status: 404 });
        }

        const storage = getStorageService();

        // Check for inline param
        const { searchParams } = new URL(request.url);
        const inline = searchParams.get("inline") === "true";
        const contentDisposition = inline ? "inline" : "attachment";

        // Try presigned URL first (S3)
        const presignedUrl = await storage.getPresignedUrl(document.storage_key);

        if (presignedUrl) {
            // S3 Redirect
            // Note: Presigned URL usually has its own content-disposition baked in if set during signed, 
            // but we can't easily change it here unless we sign with ResponseContentDisposition.
            // AWS SDK getSignedUrl supports `ResponseContentDisposition` in command params, NOT in getSignedUrl options directly/easily?
            // Actually GetObjectCommand accepts ResponseContentDisposition.
            // But `storage.getPresignedUrl` implementation (Step 449) does NOT take options for overrides.
            // It just calls `GetObjectCommand({ Bucket, Key })`.
            // So we can't control inline/attachment via redirect easily unless we update `storage.ts`.
            // We will just redirect. The browser will handle based on contentType usually.
            return NextResponse.redirect(presignedUrl);
        }

        // Local Fallback
        const download = await storage.download(document.storage_key);

        // Convert Node Stream to Web Stream
        const webStream = new ReadableStream({
            start(controller) {
                const nodeStream = download.stream as Readable;
                nodeStream.on("data", (chunk) => controller.enqueue(chunk));
                nodeStream.on("end", () => controller.close());
                nodeStream.on("error", (err) => controller.error(err));
            },
        });

        return new NextResponse(webStream, {
            headers: {
                "Content-Type": download.contentType,
                "Content-Length": download.contentLength.toString(),
                "Content-Disposition": `${contentDisposition}; filename="${document.file_name}"`,
            },
        });

    } catch (error) {
        console.error("Download error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getStorageService } from "@/lib/storage";
import { fail } from "@/lib/api/response";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "No file provided", 400);
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new AppError(
                ERROR_CODES.VALIDATION_ERROR,
                "Invalid file type. Allowed: JPEG, PNG, GIF, WebP",
                400
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new AppError(
                ERROR_CODES.VALIDATION_ERROR,
                "File too large. Maximum size: 5MB",
                400
            );
        }

        const extension = file.type.split("/")[1] || "jpg";
        const timestamp = Date.now();
        const storageKey = `users/${ctx.userId}/avatar-${timestamp}.${extension}`;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const storage = getStorageService();
        const result = await storage.upload(buffer, storageKey, file.type, true);

        // In a real S3 setup without a CDN/CNAME, we might need a signed URL, 
        // but for public buckets or simple setups, we often construct the URL.
        // However, StorageService returns a 'url' property.
        // If it's an s3:// URL, we might need to convert it to http for the frontend if the bucket isn't public.
        // But typically for profile pics, we want a publicly accessible URL.
        // Assuming the storage service returns a usable URL or we use a proxy route.
        // For now, let's assume direct access or the service returns a proper http url if configured, 
        // OR we update the user with the storage key/url. 
        // Implementation note: The existing User model has 'image' string field.

        let imageUrl = result.url;

        // If the storage service returns an s3:// URI, we need to convert it to a public URL if possible,
        // or rely on a presigned URL generator for display. 
        // For simplicity in this implementation, if it's S3, we'll try to construct a public URL 
        // assuming the bucket allows public read for these objects, OR use a proxy.
        // Let's check how other images are handled. Admin upload route returns `result.url` or `/api/storage/...` fallback.
        // Let's stick to what storage service gives us, but if it's s3://, we might want to store the key or a cloudfront URL.

        // If the result.url is local file path (in dev), we need to make it accessible via /api/storage possibly?
        // StorageService local impl returns absolute path.

        // HACK: For MVP/Dev with local storage, we need a way to serve this.
        // If S3, we usually want https://bucket.s3.region.amazonaws.com/key

        if (result.url?.startsWith("s3://")) {
            // Construct public https URL for S3
            const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
            const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
            imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${storageKey}`;
        } else if (result.url && !result.url.startsWith("http")) {
            // Likely local path
            // We probably need a retrieve route for local files, but for now let's just save it.
            // Actually, for local dev, usually we serve via a route like /api/files/[key]
            imageUrl = `/api/storage/${storageKey}`;
        }

        await prisma.user.update({
            where: { user_id: ctx.userId },
            data: { image: imageUrl },
        });

        return NextResponse.json({ url: imageUrl }, { status: 200 });

    } catch (error) {
        console.error("Profile upload error:", error);
        return fail(error);
    }
}

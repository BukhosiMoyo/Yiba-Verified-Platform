
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

        // ... (existing URL construction logic) ...

        let imageUrl = result.url;

        if (result.url?.startsWith("s3://")) {
            // Construct public https URL for S3
            const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
            const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
            imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${storageKey}`;
        } else if (result.url && !result.url.startsWith("http")) {
            imageUrl = `/api/storage/${storageKey}`;
        }

        // Cleanup: Delete old image if it exists
        const currentUser = await prisma.user.findUnique({
            where: { user_id: ctx.userId },
            select: { image: true }
        });

        if (currentUser?.image) {
            // Try to extract key from URL
            // Format: https://bucket.s3.region.amazonaws.com/users/id/avatar-ts.ext
            // or: /api/storage/users/id/avatar-ts.ext
            try {
                let oldKey = null;
                if (currentUser.image.includes(".amazonaws.com/")) {
                    oldKey = currentUser.image.split(".amazonaws.com/")[1];
                } else if (currentUser.image.includes("/api/storage/")) {
                    oldKey = currentUser.image.split("/api/storage/")[1];
                }

                if (oldKey) {
                    await storage.delete(oldKey).catch(err => console.error("Failed to delete old image:", err));
                }
            } catch (e) {
                console.error("Error parsing old image URL for deletion:", e);
            }
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

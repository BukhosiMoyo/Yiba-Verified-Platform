
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getStorageService } from "@/lib/storage";
import { fail, ok } from "@/lib/api/response";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const SETTING_KEY = "EMAIL_LOGO";

export async function POST(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        if (ctx.role !== "PLATFORM_ADMIN") {
            throw new AppError(ERROR_CODES.FORBIDDEN, "Only platform admins can manage system settings", 403);
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "No file provided", 400);
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new AppError(
                ERROR_CODES.VALIDATION_ERROR,
                "Invalid file type. Allowed: JPEG, PNG, WebP",
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

        const extension = file.type.split("/")[1] || "png";
        const timestamp = Date.now();
        const storageKey = `system/settings/email-logo-${timestamp}.${extension}`;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const storage = getStorageService();
        const result = await storage.upload(buffer, storageKey, file.type);

        if (!result.url) {
            throw new AppError(ERROR_CODES.INTERNAL_ERROR, "Storage upload failed to return a URL", 500);
        }
        let logoUrl = result.url;

        if (result.url?.startsWith("s3://")) {
            const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
            const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
            logoUrl = `https://${bucket}.s3.${region}.amazonaws.com/${storageKey}`;
        } else if (result.url && !result.url.startsWith("http")) {
            logoUrl = `/api/storage/${storageKey}`;
        }

        // Upsert the setting
        await prisma.systemSetting.upsert({
            where: { key: SETTING_KEY },
            update: { value: logoUrl },
            create: {
                key: SETTING_KEY,
                value: logoUrl,
            },
        });

        return ok({ url: logoUrl });

    } catch (error) {
        console.error("System logo upload error:", error);
        return fail(error);
    }
}

export async function GET(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        // Allow any authenticated user to view? Or just admins?
        // Since it's used in emails, it's public info effectively, but for the API...
        // Let's restrict to admins for the "settings" view, but if we need a public endpoint for the image itself, the URL is public.

        if (ctx.role !== "PLATFORM_ADMIN") {
            // throw new AppError(ERROR_CODES.FORBIDDEN, "Forbidden", 403);
            // Actually, "Settings" page might need it.
        }

        const setting = await prisma.systemSetting.findUnique({
            where: { key: SETTING_KEY },
        });

        return ok({ logoUrl: setting?.value || null });
    } catch (error) {
        return fail(error);
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        if (ctx.role !== "PLATFORM_ADMIN") {
            throw new AppError(ERROR_CODES.FORBIDDEN, "Only platform admins can manage system settings", 403);
        }

        await prisma.systemSetting.delete({
            where: { key: SETTING_KEY },
        });

        return ok({ success: true });
    } catch (error) {
        // Ignore not found
        if ((error as any).code === 'P2025') {
            return ok({ success: true });
        }
        return fail(error);
    }
}

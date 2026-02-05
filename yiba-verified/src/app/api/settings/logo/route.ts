
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getStorageService } from "@/lib/storage";
import { fail, ok } from "@/lib/api/response";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Map types to DB keys
const LOGO_KEYS = {
    LIGHT: "EMAIL_LOGO",
    DARK: "EMAIL_LOGO_DARK"
} as const;

type LogoType = keyof typeof LOGO_KEYS;

export async function POST(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        if (ctx.role !== "PLATFORM_ADMIN") {
            throw new AppError(ERROR_CODES.FORBIDDEN, "Only platform admins can manage system settings", 403);
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const type = (formData.get("type") as LogoType) || "LIGHT";

        if (!Object.keys(LOGO_KEYS).includes(type)) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid logo type. Must be LIGHT or DARK", 400);
        }

        const settingKey = LOGO_KEYS[type];

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
        // system/settings/email-logo-light-123456.png
        const storageKey = `system/settings/email-logo-${type.toLowerCase()}-${timestamp}.${extension}`;

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
            where: { key: settingKey },
            update: { value: logoUrl },
            create: {
                key: settingKey,
                value: logoUrl,
            },
        });

        return ok({ url: logoUrl, type });

    } catch (error) {
        console.error("System logo upload error:", error);
        return fail(error);
    }
}

export async function GET(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        if (ctx.role !== "PLATFORM_ADMIN") {
            // throw new AppError(ERROR_CODES.FORBIDDEN, "Forbidden", 403);
        }

        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: [LOGO_KEYS.LIGHT, LOGO_KEYS.DARK]
                }
            }
        });

        const lightLogo = settings.find((s: { key: string; value: string }) => s.key === LOGO_KEYS.LIGHT)?.value || null;
        const darkLogo = settings.find((s: { key: string; value: string }) => s.key === LOGO_KEYS.DARK)?.value || null;

        return ok({
            logoUrl: lightLogo,
            darkLogoUrl: darkLogo
        });
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

        const { searchParams } = new URL(request.url);
        const type = (searchParams.get("type") as LogoType) || "LIGHT";

        if (!Object.keys(LOGO_KEYS).includes(type)) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid logo type. Must be LIGHT or DARK", 400);
        }

        const settingKey = LOGO_KEYS[type];

        await prisma.systemSetting.delete({
            where: { key: settingKey },
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

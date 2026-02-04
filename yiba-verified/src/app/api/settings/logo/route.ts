
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { getStorageService } from "@/lib/storage";
import { getSystemSetting } from "@/lib/settings";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        if (ctx.role !== "PLATFORM_ADMIN") {
            throw new AppError(ERROR_CODES.FORBIDDEN, "Only platform admins can manage settings", 403);
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "No file provided", 400);
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "File must be an image", 400);
        }

        // Convert to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to storage (public)
        const storageService = getStorageService();
        const ext = file.name.split(".").pop() || "png";
        const key = `system/email-logo-${Date.now()}.${ext}`;

        // Explicitly upload as public so it can be viewed in emails
        const result = await storageService.upload(buffer, key, file.type, true);

        // Save URL to settings
        // Since StorageService returns s3:// for s3, we might need to convert to http url if using S3?
        // The current StorageService.upload returns `url` which is `s3://...` for S3. 
        // Email clients need HTTP(S).
        // Let's check storage.ts again... 
        // S3: `url: s3://${bucket}/${key}`. This is NOT good for emails.
        // Local: `url: filePath`. NOT good for emails.

        // START FIX for URL generation
        let publicUrl = result.url;
        if (result.url?.startsWith("s3://")) {
            // Construct public S3 URL (assuming bucket is public or we have a CDN)
            // If we don't have a CDN domain in env, we fallback to virtual-hosted style or path-style
            const bucket = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET;
            const region = process.env.AWS_REGION || process.env.S3_REGION || "us-east-1";
            // Simple heuristic: https://{bucket}.s3.{region}.amazonaws.com/{key}
            publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
        } else if (!result.url?.startsWith("http")) {
            // Local handling? Base URL + serve route?
            // If provider is local, we can't really "serve" it easily to external emails without a dedicated public route.
            // Assuming user is in Prod with S3 for now as requested ("S3 upload").
            // For local dev, we might mock it or just use the s3 path if they have s3 configured.
        }
        // END FIX

        // Update System Setting
        await prisma.systemSetting.upsert({
            where: { key: "EMAIL_LOGO_URL" },
            update: {
                value: publicUrl ?? "",
                updated_by: ctx.userId
            },
            create: {
                key: "EMAIL_LOGO_URL",
                value: publicUrl ?? "",
                updated_by: ctx.userId
            }
        });

        revalidateTag("system-settings");

        return ok({ url: publicUrl });
    } catch (error) {
        return fail(error);
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        if (ctx.role !== "PLATFORM_ADMIN") {
            throw new AppError(ERROR_CODES.FORBIDDEN, "Only platform admins can manage settings", 403);
        }

        await prisma.systemSetting.delete({
            where: { key: "EMAIL_LOGO_URL" }
        }).catch(() => { }); // Ignore if not found

        revalidateTag("system-settings");

        return ok({ deleted: true });
    } catch (error) {
        return fail(error);
    }
}

export async function GET(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);
        if (ctx.role !== "PLATFORM_ADMIN") throw new AppError(ERROR_CODES.FORBIDDEN, "Forbidden", 403);

        const logoUrl = await getSystemSetting("EMAIL_LOGO_URL");
        return ok({ logoUrl });
    } catch (error) {
        return fail(error);
    }
}

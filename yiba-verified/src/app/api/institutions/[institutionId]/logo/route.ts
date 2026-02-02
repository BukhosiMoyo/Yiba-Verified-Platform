
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { getStorageService } from "@/lib/storage";
import { fail, ok } from "@/lib/api/response";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

type Props = {
    params: {
        institutionId: string;
    };
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80) || "institution";
}

export async function POST(request: NextRequest, { params }: Props) {
    try {
        const { ctx } = await requireAuth(request);
        const { institutionId } = params;

        // Verify user has access to edit this institution
        // We check if user has a UserInstitution record with ADMIN role
        const userInstitution = await prisma.userInstitution.findUnique({
            where: {
                user_id_institution_id: {
                    user_id: ctx.userId,
                    institution_id: institutionId,
                },
            },
        });

        // Also allow PLATFORM_ADMIN
        const isPlatformAdmin = ctx.role === "PLATFORM_ADMIN";
        const isInstitutionAdmin = userInstitution?.role === "ADMIN";

        if (!isPlatformAdmin && !isInstitutionAdmin) {
            throw new AppError(ERROR_CODES.FORBIDDEN, "You do not have permission to update this institution", 403);
        }

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
        const storageKey = `institutions/${institutionId}/logo-${timestamp}.${extension}`;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const storage = getStorageService();
        const result = await storage.upload(buffer, storageKey, file.type);

        let logoUrl = result.url;

        if (result.url?.startsWith("s3://")) {
            const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
            const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
            logoUrl = `https://${bucket}.s3.${region}.amazonaws.com/${storageKey}`;
        } else if (result.url && !result.url.startsWith("http")) {
            logoUrl = `/api/storage/${storageKey}`;
        }

        // Check if profile exists; if not, create with slug.
        let profile = await prisma.institutionPublicProfile.findUnique({
            where: { institution_id: institutionId }
        });

        if (!profile) {
            // Need to create with slug
            const inst = await prisma.institution.findUnique({
                where: { institution_id: institutionId },
                select: { legal_name: true, trading_name: true },
            });

            if (!inst) throw new AppError(ERROR_CODES.NOT_FOUND, "Institution not found", 404);

            let baseSlug = slugify(inst.trading_name || inst.legal_name);
            let slug = baseSlug;
            let n = 0;
            while (await prisma.institutionPublicProfile.findUnique({ where: { slug } })) {
                n += 1;
                slug = `${baseSlug}-${n}`;
            }

            profile = await prisma.institutionPublicProfile.create({
                data: {
                    institution_id: institutionId,
                    slug,
                    is_public: false,
                    logo_url: logoUrl,
                }
            });
        } else {
            profile = await prisma.institutionPublicProfile.update({
                where: { institution_id: institutionId },
                data: { logo_url: logoUrl }
            });
        }

        return ok({ url: logoUrl });

    } catch (error) {
        return fail(error);
    }
}

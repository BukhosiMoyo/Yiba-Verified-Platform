
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

// GET /api/talent/cv/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { ctx } = await requireAuth(request);
        const { id } = await params;

        const cv = await prisma.cvVersion.findFirst({
            where: { id, user_id: ctx.userId }
        });

        if (!cv) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "CV not found", 404);
        }

        return ok(cv);
    } catch (err) {
        return fail(err);
    }
}

// PATCH /api/talent/cv/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { ctx } = await requireAuth(request);
        const { id } = await params;
        const body = await request.json();

        // Check ownership
        const existing = await prisma.cvVersion.findFirst({
            where: { id, user_id: ctx.userId }
        });

        if (!existing) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "CV not found", 404);
        }

        const updated = await prisma.cvVersion.update({
            where: { id },
            data: {
                title: body.title,
                content_json: body.content_json,
                pdf_url: body.pdf_url
            }
        });

        return ok(updated);

    } catch (err) {
        return fail(err);
    }
}

// DELETE /api/talent/cv/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { ctx } = await requireAuth(request);
        const { id } = await params;

        // Check ownership
        const existing = await prisma.cvVersion.findFirst({
            where: { id, user_id: ctx.userId }
        });

        if (!existing) {
            throw new AppError(ERROR_CODES.NOT_FOUND, "CV not found", 404);
        }

        // Optional: Check if used by public profile and unset?
        // Prisma might throw FK error if restrict?
        // PublicTalentProfile.public_cv_version_id is nullable (references CvVersion)
        // Check ON DELETE behavior. Default is usually NO ACTION or RESTRICT.
        // I should explicitly unset it from profile if passing.

        await prisma.publicTalentProfile.updateMany({
            where: { public_cv_version_id: id },
            data: { public_cv_version_id: null }
        });

        await prisma.cvVersion.delete({
            where: { id }
        });

        return ok({ deleted: true });

    } catch (err) {
        return fail(err);
    }
}

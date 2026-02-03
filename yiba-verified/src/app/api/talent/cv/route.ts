
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

// GET /api/talent/cv - List my CVs
export async function GET(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        const cvs = await prisma.cvVersion.findMany({
            where: { user_id: ctx.userId },
            orderBy: { updated_at: "desc" },
        });

        return ok(cvs);
    } catch (err) {
        return fail(err);
    }
}

// POST /api/talent/cv - Create new CV
export async function POST(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);
        const body = await request.json();

        const { title, content_json, pdf_url } = body;

        if (!title || !content_json) {
            throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Title and content are required", 400);
        }

        const cv = await prisma.cvVersion.create({
            data: {
                user_id: ctx.userId,
                title,
                content_json,
                pdf_url
            },
        });

        return ok(cv);
    } catch (err) {
        return fail(err);
    }
}

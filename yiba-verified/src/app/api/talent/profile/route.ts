
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { WorkType, TalentContactVisibility } from "@prisma/client";

// GET: Fetch my profile settings
export async function GET(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);

        const profile = await prisma.publicTalentProfile.findUnique({
            where: { user_id: ctx.userId },
            include: {
                public_cv: {
                    select: { id: true, title: true }
                }
            }
        });

        if (!profile) {
            // Return empty or null, UI handles "Create Profile" state
            return ok(null);
        }

        return ok(profile);
    } catch (err) {
        return fail(err);
    }
}

// POST: Create or Update my profile
export async function POST(request: NextRequest) {
    try {
        const { ctx } = await requireAuth(request);
        const body = await request.json();

        // extract fields
        const {
            slug,
            headline,
            bio,
            is_public,
            contact_visibility,
            work_type,
            primary_location,
            open_to_anywhere,
            public_cv_version_id
        } = body;

        // Validation
        if (slug) {
            // Check uniqueness if slug changed
            // We can rely on unique constraint exception or check manually
            const existing = await prisma.publicTalentProfile.findUnique({
                where: { slug }
            });
            if (existing && existing.user_id !== ctx.userId) {
                throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Slug already taken", 400);
            }
        }

        // Upsert
        const profile = await prisma.publicTalentProfile.upsert({
            where: { user_id: ctx.userId },
            create: {
                user_id: ctx.userId,
                slug: slug || `user-${ctx.userId.substring(0, 8)}`, // Fallback slug
                headline,
                bio,
                is_public: is_public ?? false,
                contact_visibility: contact_visibility || TalentContactVisibility.REVEAL_ON_REQUEST,
                work_type: workTypeVal(work_type),
                primary_location,
                open_to_anywhere: open_to_anywhere ?? false,
                public_cv_version_id
            },
            update: {
                slug,
                headline,
                bio,
                is_public,
                contact_visibility: contact_visibility as TalentContactVisibility,
                work_type: workTypeVal(work_type),
                primary_location,
                open_to_anywhere,
                public_cv_version_id
            }
        });

        return ok(profile);
    } catch (err) {
        return fail(err);
    }
}

function workTypeVal(val: string): WorkType {
    if (Object.values(WorkType).includes(val as WorkType)) {
        return val as WorkType;
    }
    return WorkType.ONSITE; // Default
}

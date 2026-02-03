/**
 * GET /api/qualifications
 * Public/Internal endpoint to list ACTIVE qualifications.
 * 
 * Query params:
 *   ?q=searchText
 *   ?limit=number
 *   ?offset=number
 *   ?type=enum
 *   ?nqf_level=number
 * 
 * Returns: { count, total, items: Qualification[] }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
    try {
        // Optional: Public or authenticated? 
        // Usually lists are public or require minimal auth. 
        // We'll allow public for now or assume middleware handles basic protection.
        // If strict auth needed: await requireAuth(request);

        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get("q") || "";
        const limitParam = searchParams.get("limit");
        const offsetParam = searchParams.get("offset");
        const type = searchParams.get("type");
        const nqfLevel = searchParams.get("nqf_level");

        const limit = Math.min(
            limitParam ? parseInt(limitParam, 10) : 50,
            100
        );
        const offset = Math.max(0, offsetParam ? parseInt(offsetParam, 10) : 0);

        const where: any = {
            deleted_at: null,
            status: "ACTIVE", // Only show ACTIVE qualifications in public list
        };

        if (type) where.type = type;
        if (nqfLevel) where.nqf_level = parseInt(nqfLevel, 10);

        if (searchQuery.trim()) {
            where.OR = [
                { name: { contains: searchQuery, mode: "insensitive" } },
                { code: { contains: searchQuery, mode: "insensitive" } },
            ];
        }

        const total = await prisma.qualification.count({ where });

        const qualifications = await prisma.qualification.findMany({
            where,
            orderBy: { name: "asc" },
            skip: offset,
            take: limit,
            select: {
                qualification_id: true,
                name: true,
                code: true,
                type: true,
                nqf_level: true,
                study_mode: true,
                duration_value: true,
                duration_unit: true,
                // Minimal fields for list
            }
        });

        return ok({
            count: qualifications.length,
            total,
            items: qualifications,
        });

    } catch (error) {
        return fail(error);
    }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WorkType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = 20;
        const skip = (page - 1) * pageSize;

        // Filters
        const search = searchParams.get("search"); // Name, headline, bio, skills (via user?)
        const location = searchParams.get("location");
        const workType = searchParams.get("work_type");
        // const skills = searchParams.get("skills"); // Future: Filter by related skills if possible

        const where: any = {
            is_public: true, // STRICT: Only public profiles
        };

        if (search) {
            where.OR = [
                { headline: { contains: search, mode: "insensitive" } },
                { bio: { contains: search, mode: "insensitive" } },
                {
                    user: {
                        OR: [
                            { first_name: { contains: search, mode: "insensitive" } },
                            { last_name: { contains: search, mode: "insensitive" } },
                        ],
                    },
                },
            ];
        }

        if (location) {
            where.primary_location = {
                contains: location,
                mode: "insensitive",
            };
        }

        if (workType) {
            if (Object.values(WorkType).includes(workType as WorkType)) {
                where.work_type = workType as WorkType;
            }
        }

        // Execute query
        const [total, profiles] = await Promise.all([
            prisma.publicTalentProfile.count({ where }),
            prisma.publicTalentProfile.findMany({
                where,
                take: pageSize,
                skip,
                orderBy: {
                    updated_at: "desc", // Default sort
                },
                include: {
                    user: {
                        select: {
                            first_name: true,
                            last_name: true,
                            image: true,
                            // Do NOT select email/phone here for list view
                        },
                    },
                },
            }),
        ]);

        return NextResponse.json({
            data: profiles,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });

    } catch (error) {
        console.error("Error fetching public talent:", error);
        return NextResponse.json(
            { error: "Failed to fetch talent directory" },
            { status: 500 }
        );
    }
}

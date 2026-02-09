import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InstitutionOutreachProfile } from "@/lib/outreach/types";

// GET /api/platform-admin/outreach/pipeline
// Contact-centric pipeline view
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const stage = searchParams.get("stage");
        const province = searchParams.get("province");
        const search = searchParams.get("search") || "";

        // Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;

        const where: any = {
            // Hard Rule: Email is the primary unique identifier. Leads without email must not enter.
            email: {
                not: ""
            }
        };

        // Filter by Stage
        if (stage && stage !== "all") {
            where.engagement_state = stage;
        }

        // Filter by Province (via Relation)
        if (province && province !== "all") {
            where.institution = {
                province: province
            };
        }

        // Search (Email OR Institution Name)
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { institution: { legal_name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        // Fetch Invites (Cards)
        const [invites, total] = await prisma.$transaction([
            prisma.invite.findMany({
                where,
                include: {
                    institution: {
                        select: {
                            legal_name: true,
                            province: true,
                            institution_id: true,
                            contact_person_name: true, // fallback
                            contact_email: true // fallback
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            }),
            prisma.invite.count({ where })
        ]);

        // Map to InstitutionOutreachProfile (acting as Card Data)
        const profiles: InstitutionOutreachProfile[] = invites.map((invite) => {
            const institutionName = invite.institution?.legal_name || "Unknown Institution";
            const institutionId = invite.institution_id || "unknown"; // Should fallback gracefully
            const provinceVal = invite.institution?.province || "Unknown"; // defaults

            return {
                id: invite.invite_id, // Unique Card ID
                institution_id: institutionId,
                institution_name: institutionName,
                domain: invite.email.split('@')[1] || "",
                province: provinceVal,
                engagement_stage: invite.engagement_state,
                engagement_score: invite.engagement_score_raw,
                last_activity: invite.last_interaction_at || invite.created_at,
                next_scheduled_step: null,
                status_flags: {
                    bounced: false,
                    opt_out: false,
                    declined: invite.engagement_state === "DECLINED",
                    ai_suppressed: false
                },
                contacts: [
                    {
                        contact_id: invite.invite_id, // Use invite_id as contact_id for specific card
                        email: invite.email,
                        first_name: "",
                        last_name: "",
                        role: "Contact", // Can use invite.role enum potentially?
                        primary: true
                    }
                ]
            };
        });

        return NextResponse.json({
            data: profiles,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("[PIPELINE GET] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EngagementState, InstitutionOutreachProfile } from "@/lib/outreach/types";

// GET /api/platform-admin/outreach/institutions/[institutionId]
export async function GET(
    req: Request,
    { params }: { params: Promise<{ institutionId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { institutionId } = await params;

        const inst = await prisma.institution.findUnique({
            where: { institution_id: institutionId },
            include: {
                invites: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                },
                contacts: {
                    take: 1
                }
            }
        });

        if (!inst) {
            return NextResponse.json({ error: "Institution not found" }, { status: 404 });
        }

        const primaryInvite = inst.invites[0];

        const profile: InstitutionOutreachProfile = {
            institution_id: inst.institution_id,
            institution_name: inst.trading_name || inst.legal_name,
            domain: inst.contact_email ? inst.contact_email.split('@')[1] : 'unknown',
            province: inst.province,
            engagement_stage: primaryInvite?.engagement_state || EngagementState.UNCONTACTED,
            engagement_score: primaryInvite?.engagement_score_raw || 0,
            last_activity: primaryInvite?.last_interaction_at || inst.updated_at,
            next_scheduled_step: null,
            status_flags: {
                bounced: false,
                opt_out: primaryInvite?.status === "DECLINED",
                declined: primaryInvite?.status === "DECLINED",
                ai_suppressed: false
            },
            contacts: primaryInvite ? [{
                contact_id: primaryInvite.invite_id,
                email: primaryInvite.email,
                first_name: "Admin",
                last_name: "",
                role: primaryInvite.role,
                primary: true
            }] : []
        };

        return NextResponse.json(profile);

    } catch (error) {
        console.error("Failed to fetch institution:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

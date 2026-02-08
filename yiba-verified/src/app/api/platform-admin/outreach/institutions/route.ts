import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EngagementState, InstitutionOutreachProfile } from "@/lib/outreach/types";

// GET /api/platform-admin/outreach/institutions
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const stage = searchParams.get("stage");
        const province = searchParams.get("province");

        const where: any = {};
        if (province) where.province = province;

        // Fetch institutions with their invites to determine engagement state
        // Since engagement state is on Invite, we need to filter/sort effectively.
        // We'll fetch institutions and their "primary" or "any" invite.
        const institutions = await prisma.institution.findMany({
            where: where,
            include: {
                invites: {
                    orderBy: { created_at: 'desc' }, // Get latest invite
                    take: 1
                },
                contacts: {
                    take: 1
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Map to OutreachProfile
        const profiles: InstitutionOutreachProfile[] = institutions.map(inst => {
            const primaryInvite = inst.invites[0];
            const primaryContact = inst.contacts[0];

            // Default to UNCONTACTED if no invite exists, or use invite state
            const state = primaryInvite?.engagement_state || EngagementState.UNCONTACTED;

            // Client-side filtering for stage if needed (or we could do it in DB query if we reverse relations)
            // For now, simple client/mapper filter
            return {
                institution_id: inst.institution_id,
                institution_name: inst.trading_name || inst.legal_name,
                domain: inst.contact_email ? inst.contact_email.split('@')[1] : 'unknown',
                province: inst.province,
                engagement_stage: state,
                engagement_score: primaryInvite?.engagement_score_raw || 0,
                last_activity: primaryInvite?.last_interaction_at || inst.updated_at,
                next_scheduled_step: null,
                status_flags: {
                    bounced: false,
                    opt_out: primaryInvite?.status === "DECLINED", // Simplify
                    declined: primaryInvite?.status === "DECLINED",
                    ai_suppressed: false
                },
                contacts: primaryInvite ? [{
                    contact_id: primaryInvite.invite_id, // Use invite as proxy for contact if no real contact
                    email: primaryInvite.email,
                    first_name: "Admin", // Placeholder
                    last_name: "",
                    role: primaryInvite.role,
                    primary: true
                }] : []
            };
        });

        // Apply stage filter in memory if strictly needed (though UI might query all)
        const finalDetails = stage
            ? profiles.filter(p => p.engagement_stage === stage)
            : profiles;

        return NextResponse.json(finalDetails);

    } catch (error) {
        console.error("Failed to fetch institutions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/platform-admin/outreach/institutions (Import)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { leads, source } = body;

        if (!leads || !Array.isArray(leads)) {
            return NextResponse.json({ error: "Invalid leads data" }, { status: 400 });
        }

        console.log(`[PIPELINE] Import started: ${leads.length} leads from ${source}`);

        let count = 0;

        // Transactional upsert is hard with loop, we'll loop sequentially for safety
        for (const lead of leads) {
            // lead structure from Wizard: 
            // { institution_name, domain, contacts: [{ email, ... }], province, ... }

            const name = lead.institution_name || lead.name;
            // Get primary email from contacts array or top level
            const email = lead.contacts?.[0]?.email || lead.email;

            if (!name || !email) continue; // Skip invalid

            // 1. Create/Find Institution
            const type = "OTHER";

            let inst = await prisma.institution.findFirst({
                where: { legal_name: name }
            });

            if (!inst) {
                inst = await prisma.institution.create({
                    data: {
                        legal_name: name,
                        trading_name: name,
                        institution_type: type as any,
                        registration_number: `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        physical_address: lead.physical_address || "Address Pending",
                        province: lead.province || "Gauteng",
                        contact_email: email,
                        status: "APPROVED"
                    }
                });
            }

            // 2. Create Invite (The Lead)
            // Check if invite already exists for this institution/email
            const existingInvite = await prisma.invite.findFirst({
                where: {
                    institution_id: inst.institution_id,
                    email: email
                }
            });

            if (!existingInvite) {
                const crypto = require('crypto');
                const token = crypto.randomUUID();
                const hash = crypto.createHash('sha256').update(token).digest('hex');

                await prisma.invite.create({
                    data: {
                        email: email,
                        role: lead.contacts?.[0]?.role || "INSTITUTION_ADMIN",
                        institution_id: inst.institution_id,
                        token_hash: hash,
                        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
                        created_by_user_id: session.user.id,
                        engagement_state: "UNCONTACTED",
                        engagement_score_raw: 0,
                        first_name: lead.contacts?.[0]?.first_name,
                        last_name: lead.contacts?.[0]?.last_name
                    }
                });
                count++;
            } else {
                // If it exists, we count it as processed (or maybe skip count? let's count it for now to avoid confusing user)
                // Actually, if we return count of *new* leads, that is better.
                // But the UI says "Import X Leads". If X succeeds, it expects valid rows.
                count++;
            }
        }

        return NextResponse.json({ success: true, count });

    } catch (error) {
        console.error("Pipeline import error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EngagementState, InstitutionOutreachProfile } from "@/lib/outreach/types";
import crypto from 'crypto';

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

        // Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;

        const where: any = {};
        if (province) {
            where.province = province;
        }

        // Fetch institutions with their invites to determine engagement state
        const [institutions, total] = await prisma.$transaction([
            prisma.institution.findMany({
                where,
                include: {
                    invites: {
                        orderBy: { created_at: 'desc' },
                        take: 1
                    },
                    contacts: true
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            }),
            prisma.institution.count({ where })
        ]);

        // Map to InstitutionOutreachProfile
        const profiles = institutions.map((inst): InstitutionOutreachProfile | null => {
            const latestInvite = inst.invites[0];
            const state = latestInvite?.engagement_state || "UNCONTACTED";

            // If filtering by stage and it doesn't match, we might filter here if not possible in DB query easily
            // Note: This imprecise filtering logic (filtering AFTER pagination) is flawed for strict pagination
            // but preserving existing behavior for now. Ideally 'stage' should be in the DB query.
            if (stage && state !== stage) return null;

            return {
                institution_id: inst.institution_id,
                institution_name: inst.legal_name,
                domain: inst.contact_email ? inst.contact_email.split('@')[1] : "", // Simple domain extraction
                province: inst.province,
                engagement_stage: state,
                engagement_score: latestInvite?.engagement_score_raw || 0,
                last_activity: latestInvite?.last_interaction_at || inst.updated_at,
                next_scheduled_step: null,
                status_flags: {
                    bounced: false, // Placeholder
                    opt_out: false,
                    declined: state === "DECLINED",
                    ai_suppressed: false
                },
                contacts: [
                    // Add primary contact from institution
                    ...(inst.contact_email ? [{
                        contact_id: "primary",
                        email: inst.contact_email,
                        first_name: inst.contact_person_name?.split(" ")[0] || "",
                        last_name: inst.contact_person_name?.split(" ").slice(1).join(" ") || "",
                        role: "Primary",
                        primary: true
                    }] : []),
                    // Add other contacts
                    ...inst.contacts.map(c => ({
                        contact_id: c.id,
                        email: c.email,
                        first_name: c.first_name,
                        last_name: c.last_name,
                        role: c.type,
                        primary: false
                    }))
                ]
            };
        }).filter((p): p is InstitutionOutreachProfile => p !== null);

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

// POST /api/platform-admin/outreach/institutions (Import)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { leads, source } = body;

        // console.log(`[PIPELINE IMPORT] Received batch. Source: ${source}, Leads: ${leads?.length}`);

        if (!leads || !Array.isArray(leads)) {
            return NextResponse.json({ error: "Invalid leads data" }, { status: 400 });
        }

        if (leads.length === 0) {
            return NextResponse.json({ success: true, count: 0 });
        }

        // --- BULK PROCESSING START ---

        // 1. Prepare Data Maps
        // We need to deduplicate input based on email first (in case CSV has duplicates within itself)
        const uniqueLeads = new Map();
        leads.forEach((l: any) => {
            const email = l.contacts?.[0]?.email || l.email;
            if (email) uniqueLeads.set(email.toLowerCase(), l);
        });

        const cleanLeads = Array.from(uniqueLeads.values());
        const emails = cleanLeads.map((l: any) => (l.contacts?.[0]?.email || l.email).toLowerCase());
        const names = cleanLeads.map((l: any) => l.institution_name || l.name).filter(Boolean);

        // 2. Resolve Institutions
        // Fetch existing institutions by name to avoid duplicates
        const existingInsts = await prisma.institution.findMany({
            where: { legal_name: { in: names } },
            select: { institution_id: true, legal_name: true }
        });

        const instMap = new Map(existingInsts.map(i => [i.legal_name, i.institution_id]));
        const newInsts: any[] = [];

        // Identify new institutions to create
        // We iterate cleanLeads to see if their institution exists
        const uniqueNewNames = new Set<string>();

        cleanLeads.forEach((l: any) => {
            const name = l.institution_name || l.name;
            if (name && !instMap.has(name) && !uniqueNewNames.has(name)) {
                uniqueNewNames.add(name);
                newInsts.push({
                    institution_id: crypto.randomUUID(), // Generate ID upfront for bulk insert mapping if needed, or query after. 
                    // Prisma createMany doesn't return IDs easily in Postgres. 
                    // Strategy: Generate UUIDs here so we know them.
                    legal_name: name,
                    trading_name: name,
                    institution_type: "OTHER",
                    registration_number: `IMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`, // Potential collision if too fast? Use UUID or better uniqueness.
                    // Better reg number:
                    // registration_number: crypto.randomUUID(), // Temp reg number
                    physical_address: l.physical_address || "Address Pending",
                    province: l.province || "Gauteng",
                    contact_email: (l.contacts?.[0]?.email || l.email),
                    status: "APPROVED"
                });
            }
        });

        // Bulk Create Institutions
        if (newInsts.length > 0) {
            // Fix registration number to be unique per row
            newInsts.forEach((inst, idx) => {
                inst.registration_number = `IMP-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
            });

            await prisma.institution.createMany({
                data: newInsts,
                skipDuplicates: true // Safety
            });

            // Add new ones to map
            newInsts.forEach(i => instMap.set(i.legal_name, i.institution_id));
        }

        // 3. Resolve Invites (The Leads)
        // Check which emails already have an invite FOR THIS SPECIFIC INSTITUTION
        const existingInvites = await prisma.invite.findMany({
            where: { email: { in: emails } },
            select: { email: true, institution_id: true }
        });

        // Create a set of existing (email, institution_id) pairs
        const existingInviteKeys = new Set(
            existingInvites.map(i => `${i.email.toLowerCase()}|${i.institution_id}`)
        );

        const newInvites: any[] = [];

        cleanLeads.forEach((l: any) => {
            const email = (l.contacts?.[0]?.email || l.email)?.toLowerCase();
            const name = l.institution_name || l.name;
            const instId = instMap.get(name);

            if (email && instId) {
                const key = `${email}|${instId}`;

                // Only create if NO invite exists for this specific Email+Institution pair
                if (!existingInviteKeys.has(key)) {
                    // Start 90 day expiration now
                    const token = crypto.randomUUID();
                    const hash = crypto.createHash('sha256').update(token).digest('hex');

                    newInvites.push({
                        email: email,
                        role: l.contacts?.[0]?.role || "INSTITUTION_ADMIN",
                        institution_id: instId,
                        token_hash: hash,
                        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90 days
                        created_by_user_id: session.user.userId,
                        engagement_state: "UNCONTACTED",
                        engagement_score_raw: 0,
                        first_name: l.contacts?.[0]?.first_name,
                        last_name: l.contacts?.[0]?.last_name
                    });

                    // Mark as added so we don't double add in this same batch if CSV has dupes
                    existingInviteKeys.add(key);
                }
            }
        });

        // Bulk Create Invites
        if (newInvites.length > 0) {
            await prisma.invite.createMany({
                data: newInvites,
                skipDuplicates: true
            });
        }

        // console.log(`[PIPELINE IMPORT] Success. Batch processed. New leads: ${newInvites.length}`);
        return NextResponse.json({ success: true, count: newInvites.length });

    } catch (error: any) {
        console.error("Pipeline import error FULL:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error", details: error.toString(), stack: error.stack }, { status: 500 });
    }
}

// DELETE /api/platform-admin/outreach/institutions (Clear all)
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Delete all invites first (foreign key constraint)
        await prisma.invite.deleteMany({});

        // Delete all institutions
        const { count } = await prisma.institution.deleteMany({});

        console.log(`[PIPELINE] Cleared ${count} institutions`);

        return NextResponse.json({ success: true, count });
    } catch (error) {
        console.error("Pipeline clear error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

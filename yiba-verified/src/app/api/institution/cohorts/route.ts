
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";
import { getCurrentInstitutionForUser } from "@/lib/currentInstitution";
import { hasCap } from "@/lib/capabilities";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // ACTIVE, COMPLETED, ARCHIVED

    // Resolve institution context
    const { currentInstitutionId } = await getCurrentInstitutionForUser(session.user.userId, null);
    if (!currentInstitutionId) {
        return new NextResponse("Institution context required", { status: 400 });
    }

    // Check permissions
    // Facilitators can view cohorts they are assigned to.
    // Admins/Staff can view all cohorts.
    const role = session.user.role as Role;

    // Base query
    const where: any = {
        institution_id: currentInstitutionId,
    };

    if (status) {
        where.status = status;
    }

    // Facilitator filtering
    if (role === "FACILITATOR") {
        // Determine facilitator ID for the user
        // The link is User -> Facilitator (via user_id)
        // Facilitators are linked to cohorts via 'facilitators' relation in Cohort model
        // But wait, Facilitator model has `user_id`.

        // We need to find the facilitator record for this user
        const facilitatorProfile = await prisma.facilitator.findFirst({
            where: { user_id: session.user.userId }
        });

        if (!facilitatorProfile) {
            return NextResponse.json({ cohorts: [] }); // No facilitator profile, no cohorts
        }

        // Filter cohorts where this facilitator is in the list
        where.facilitators = {
            some: {
                facilitator_id: facilitatorProfile.facilitator_id
            }
        };
    } else {
        // Admin/Staff/Platform Admin check
        // Ensure they have minimal view capability
        if (!hasCap(role, "ATTENDANCE_VIEW") && !hasCap(role, "LEARNER_VIEW")) {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }

    const cohorts = await prisma.cohort.findMany({
        where,
        include: {
            qualification: {
                select: {
                    code: true,
                    name: true,
                },
            },
            _count: {
                select: { enrolments: true },
            },
        },
        orderBy: { created_at: "desc" },
    });

    return NextResponse.json(cohorts);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    // Resolve institution context
    const { currentInstitutionId } = await getCurrentInstitutionForUser(session.user.userId, null);
    if (!currentInstitutionId) {
        return new NextResponse("Institution context required", { status: 400 });
    }

    // Capability check
    const role = session.user.role as Role;
    // Use a relevant capability. ENROLMENT_CREATE or similar? 
    // Let's assume INSTITUTION_ADMIN or STAFF can create cohorts.
    // We didn't define specific COHORT_CREATE capability, but we can reuse ENROLMENT_CREATE or similar, or just check role.
    // Ideally, add COHORT_MANAGE to capabilities. For now allow Admin/Staff with LEARNER_CREATE.
    if (!hasCap(role, "LEARNER_CREATE")) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { name, qualification_id, start_date, end_date } = body;

    if (!name || !qualification_id) {
        return new NextResponse("Missing required fields", { status: 400 });
    }

    const cohort = await prisma.cohort.create({
        data: {
            institution_id: currentInstitutionId,
            name,
            qualification_id,
            start_date: start_date ? new Date(start_date) : null,
            end_date: end_date ? new Date(end_date) : null,
            status: "ACTIVE",
        },
    });

    return NextResponse.json(cohort);
}

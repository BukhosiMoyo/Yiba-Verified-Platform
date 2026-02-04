
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";
import { getCurrentInstitutionForUser } from "@/lib/currentInstitution";
import { hasCap } from "@/lib/capabilities";

type Props = {
    params: Promise<{ cohortId: string }>;
};

// GET: List learners in cohort
export async function GET(req: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { cohortId } = await params;
    const { currentInstitutionId } = await getCurrentInstitutionForUser(session.user.userId, null);
    if (!currentInstitutionId) return new NextResponse("Institution context required", { status: 400 });

    // Basic access check
    const role = session.user.role as Role;
    if (role === "FACILITATOR") {
        // Must be assigned
        const fac = await prisma.facilitator.findFirst({ where: { user_id: session.user.userId } });
        if (!fac) return new NextResponse("Forbidden", { status: 403 });
        const cohort = await prisma.cohort.findFirst({
            where: { cohort_id: cohortId, facilitators: { some: { facilitator_id: fac.facilitator_id } } }
        });
        if (!cohort) return new NextResponse("Forbidden", { status: 403 });
    } else {
        if (!hasCap(role, "LEARNER_VIEW") && !hasCap(role, "ATTENDANCE_VIEW")) {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }

    const enrolments = await prisma.enrolment.findMany({
        where: { cohort_id: cohortId },
        include: {
            learner: { select: { first_name: true, last_name: true, national_id: true, email: true } }
        }
    });

    return NextResponse.json(enrolments);
}

// POST: Add learners to cohort
export async function POST(req: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { cohortId } = await params;
    const { currentInstitutionId } = await getCurrentInstitutionForUser(session.user.userId, null);
    if (!currentInstitutionId) return new NextResponse("Institution context required", { status: 400 });

    const role = session.user.role as Role;
    // Capability: ENROLMENT_EDIT_STATUS or LEARNER_EDIT?
    // Assigning to cohort is editing enrolment.
    if (!hasCap(role, "ENROLMENT_EDIT_STATUS")) {
        return new NextResponse("Forbidden", { status: 403 });
    }
    // Facilitators typically cannot assign learners?
    if (role === "FACILITATOR") return new NextResponse("Forbidden", { status: 403 });

    const body = await req.json();
    const { enrolment_ids } = body; // Array of enrolment IDs to ADD

    if (!Array.isArray(enrolment_ids) || enrolment_ids.length === 0) {
        return new NextResponse("No enrolments provided", { status: 400 });
    }

    // Update enrolments
    // Ensure they belong to this institution
    await prisma.enrolment.updateMany({
        where: {
            enrolment_id: { in: enrolment_ids },
            institution_id: currentInstitutionId
        },
        data: {
            cohort_id: cohortId
        }
    });

    return NextResponse.json({ success: true });
}

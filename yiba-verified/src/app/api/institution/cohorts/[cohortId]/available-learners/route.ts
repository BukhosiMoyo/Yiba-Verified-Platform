
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

export async function GET(req: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { cohortId } = await params;
    const { currentInstitutionId } = await getCurrentInstitutionForUser(session.user.userId, null);
    if (!currentInstitutionId) return new NextResponse("Institution context required", { status: 400 });

    const role = session.user.role as Role;
    if (!hasCap(role, "ENROLMENT_EDIT_STATUS")) return new NextResponse("Forbidden", { status: 403 });

    // Get cohort qualification
    const cohort = await prisma.cohort.findUnique({
        where: { cohort_id: cohortId },
        select: { qualification_id: true }
    });

    if (!cohort) return new NextResponse("Cohort not found", { status: 404 });

    // Find available enrolments
    const available = await prisma.enrolment.findMany({
        where: {
            institution_id: currentInstitutionId,
            qualification_id: cohort.qualification_id,
            cohort_id: null, // Not in a cohort
            enrolment_status: "ACTIVE"
        },
        select: {
            enrolment_id: true,
            learner: {
                select: {
                    first_name: true,
                    last_name: true,
                    national_id: true
                }
            }
        }
    });

    return NextResponse.json(available);
}


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";
import { getCurrentInstitutionForUser } from "@/lib/currentInstitution";
import { hasCap } from "@/lib/capabilities";

type Props = {
    params: Promise<{ sessionId: string }>;
};

export async function GET(req: Request, { params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { sessionId } = await params;

    // Resolve institution context
    const { currentInstitutionId } = await getCurrentInstitutionForUser(session.user.userId, null);
    if (!currentInstitutionId) {
        return new NextResponse("Institution context required", { status: 400 });
    }

    // Capability check including Facilitator
    const role = session.user.role as Role;
    if (role === "FACILITATOR") {
        // Facilitator check: must be assigned to cohort
        const fac = await prisma.facilitator.findFirst({ where: { user_id: session.user.userId } });
        if (!fac) return new NextResponse("Forbidden", { status: 403 });

        const sessionCheck = await prisma.classSession.findUnique({
            where: { session_id: sessionId },
            include: { cohort: { include: { facilitators: true } } }
        });

        const isAssigned = sessionCheck?.cohort.facilitators.some(f => f.id === fac.id);
        if (!isAssigned) return new NextResponse("Forbidden: Not assigned to this cohort", { status: 403 });

    } else {
        if (!hasCap(role, "ATTENDANCE_VIEW")) {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }

    // Fetch Session + Cohort Enrolments + Existing Attendance
    const classSession = await prisma.classSession.findUnique({
        where: { session_id: sessionId },
        include: {
            cohort: {
                include: {
                    enrolments: {
                        where: { enrolment_status: "ACTIVE" }, // Only active learners
                        include: {
                            learner: { select: { first_name: true, last_name: true, id_number: true } }
                        }
                    }
                }
            },
            attendanceRecords: true // Existing records
        }
    });

    if (!classSession) {
        return new NextResponse("Session not found", { status: 404 });
    }

    // Transform for UI
    // Map enrolments to a structure that includes current attendance status if exists
    const register = classSession.cohort.enrolments.map(enrolment => {
        const record = classSession.attendanceRecords.find(r => r.enrolment_id === enrolment.enrolment_id);
        return {
            enrolment_id: enrolment.enrolment_id,
            learner: enrolment.learner,
            attendance: record ? {
                status: record.status,
                minutes_late: record.minutes_late,
                notes: "" // Add notes to schema if needed
            } : null
        };
    });

    return NextResponse.json({
        session: {
            session_id: classSession.session_id,
            date: classSession.date,
            start_time: classSession.start_time,
            end_time: classSession.end_time,
            session_type: classSession.session_type,
            is_locked: classSession.is_locked,
            cohort_name: classSession.cohort.name
        },
        register
    });
}

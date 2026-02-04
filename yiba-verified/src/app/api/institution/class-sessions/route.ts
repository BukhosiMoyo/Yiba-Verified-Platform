
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
    const cohortId = searchParams.get("cohort_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Resolve institution context
    const { currentInstitutionId } = await getCurrentInstitutionForUser(session.user.userId, null);
    if (!currentInstitutionId) {
        return new NextResponse("Institution context required", { status: 400 });
    }

    const role = session.user.role as Role;

    // Base query: sessions belonging to cohorts in this institution
    // We need to filter by institution_id via Cohort relation
    const where: any = {
        cohort: {
            institution_id: currentInstitutionId,
        },
    };

    if (cohortId) {
        where.cohort_id = cohortId;
    }

    if (startDate && endDate) {
        where.date = {
            gte: new Date(startDate),
            lte: new Date(endDate),
        };
    } else if (startDate) {
        where.date = {
            gte: new Date(startDate),
        };
    }

    // RBAC for Facilitators
    if (role === "FACILITATOR") {
        // Check if facilitator is assigned to valid cohort
        const fac = await prisma.facilitator.findFirst({ where: { user_id: session.user.userId } });
        if (!fac) return new NextResponse("Forbidden", { status: 403 });

        // Ensure filtering by cohorts assigned to facilitator
        if (searchParams.get("cohort_id")) {
            const hasAccess = await prisma.cohort.count({
                where: {
                    cohort_id: searchParams.get("cohort_id")!,
                    facilitators: { some: { facilitator_id: fac.facilitator_id } }
                }
            });
            if (hasAccess === 0) return new NextResponse("Forbidden", { status: 403 });
        } else {
            // If no specific cohort_id is requested, filter by cohorts assigned to the facilitator
            where.cohort.facilitators = {
                some: {
                    facilitator_id: fac.facilitator_id
                }
            };
        }
    } else {
        if (!hasCap(role, "ATTENDANCE_VIEW")) {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }

    const sessions = await prisma.classSession.findMany({
        where,
        include: {
            cohort: {
                select: {
                    name: true,
                    qualification: { select: { title: true } }
                },
            },
            _count: {
                select: { attendanceRecords: true },
            },
        },
        orderBy: { date: "asc" },
    });

    return NextResponse.json(sessions);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { currentInstitutionId } = await getCurrentInstitutionForUser(session.user.userId, null);
    if (!currentInstitutionId) {
        return new NextResponse("Institution context required", { status: 400 });
    }

    const role = session.user.role as Role;
    // Capability check: Who can schedule sessions?
    // Admin/Staff with relevant capability. 
    if (!hasCap(role, "ENROLMENT_CREATE") && !hasCap(role, "ATTENDANCE_CAPTURE")) {
        return new NextResponse("Forbidden", { status: 403 });
    }
    // Facilitators cannot SCHEDULE sessions usually?
    // Let's assume for now they CANNOT schedule, unless they have specific permission.
    // The 'ATTENDANCE_CAPTURE' capability is assigned to Facilitator, but scheduling is different.
    // If role is FACILITATOR, deny creation for now unless we decide otherwise.
    if (role === "FACILITATOR") {
        return new NextResponse("Forbidden: Facilitators cannot create sessions", { status: 403 });
    }

    const body = await req.json();
    const { cohort_id, date, start_time, end_time, session_type, location, notes } = body;

    if (!cohort_id || !date) {
        return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify cohort belongs to institution
    const cohort = await prisma.cohort.findUnique({
        where: { cohort_id },
    });

    if (!cohort || cohort.institution_id !== currentInstitutionId) {
        return new NextResponse("Invalid cohort", { status: 400 });
    }

    const classSession = await prisma.classSession.create({
        data: {
            cohort_id,
            date: new Date(date),
            start_time,
            end_time,
            session_type: session_type || "THEORY",
            location,
            notes,
        },
    });

    return NextResponse.json(classSession);
}

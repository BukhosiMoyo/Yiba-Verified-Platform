
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";
import { getCurrentInstitutionForUser } from "@/lib/currentInstitution";
import { hasCap } from "@/lib/capabilities";
import type { AttendanceStatus } from "@prisma/client";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { currentInstitutionId } = await getCurrentInstitutionForUser(session.user.userId, null);
    if (!currentInstitutionId) {
        return new NextResponse("Institution context required", { status: 400 });
    }

    const role = session.user.role as Role;

    // Parse body
    const body = await req.json();
    const { session_id, records, is_locking } = body;
    // records: { enrolment_id: string, status: AttendanceStatus, minutes_late?: number }[]

    if (!session_id || !Array.isArray(records)) {
        return new NextResponse("Invalid request body", { status: 400 });
    }

    // Verify Session and RBAC
    const classSession = await prisma.classSession.findUnique({
        where: { session_id },
        include: { cohort: { include: { facilitators: true } } }
    });

    if (!classSession) return new NextResponse("Session not found", { status: 404 });

    if (classSession.is_locked) {
        // Allow unlocking? Only admins?
        // For now, if locked, deny changes unless we are specifically unlocking (which would be a separate action/endpoint usually).
        // Assuming this endpoint is for marking.
        return new NextResponse("Session is locked", { status: 400 });
    }

    if (role === "FACILITATOR") {
        const fac = await prisma.facilitator.findFirst({ where: { user_id: session.user.userId } });
        if (!fac) return new NextResponse("Forbidden", { status: 403 });
        const isAssigned = classSession.cohort.facilitators.some(f => f.facilitator_id === fac.facilitator_id);
        if (!isAssigned) return new NextResponse("Forbidden: Not assigned to this cohort", { status: 403 });
    } else {
        if (!hasCap(role, "ATTENDANCE_CAPTURE")) {
            return new NextResponse("Forbidden", { status: 403 });
        }
    }

    // Process updates transactionally
    await prisma.$transaction(async (tx) => {
        for (const record of records) {
            const { enrolment_id, status, minutes_late } = record;

            // Determine record_date from session date
            // We use the session date as the record_date
            const recordDate = classSession.date;

            // Upsert record
            // Note: The unique constraint is [enrolment_id, record_date]. 
            // If a record exists for this day (maybe from another session?), we overwrite it?
            // Or we utilize session_id if we migrated constraint.
            // Constraint is [enrolment_id, record_date].
            // So we update the existing record for this date.

            await tx.attendanceRecord.upsert({
                where: {
                    enrolment_id_record_date: {
                        enrolment_id,
                        record_date: recordDate
                    }
                },
                update: {
                    status: status as AttendanceStatus,
                    minutes_late: minutes_late || null,
                    session_id: session_id, // Link to this session
                    marked_at: new Date(),
                    marked_by: session.user.userId
                },
                create: {
                    enrolment_id,
                    record_date: recordDate,
                    status: status as AttendanceStatus,
                    minutes_late: minutes_late || null,
                    session_id: session_id,
                    marked_by: session.user.userId
                }
            });
        }

        // If locking requested
        if (is_locking) {
            await tx.classSession.update({
                where: { session_id },
                data: {
                    is_locked: true,
                    locked_at: new Date(),
                    locked_by_user_id: session.user.userId
                }
            });
        }
    });

    return NextResponse.json({ success: true });
}

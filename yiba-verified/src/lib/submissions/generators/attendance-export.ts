import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

interface AttendanceConfig {
    cohort_id: string;
    start_date: string;
    end_date: string;
}

export async function generateAttendanceCSV(config: AttendanceConfig): Promise<string> {
    const { cohort_id, start_date, end_date } = config;

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);

    // Fetch records with learner details
    const records = await prisma.attendanceRecord.findMany({
        where: {
            record_date: {
                gte: startDate,
                lte: endDate,
            },
            enrolment: {
                cohort_id: cohort_id,
                deleted_at: null,
            },
        },
        include: {
            enrolment: {
                select: {
                    learner: {
                        select: {
                            first_name: true,
                            last_name: true,
                            national_id: true,
                            alternate_id: true,
                        }
                    },
                    qualification_title: true, // Useful context
                    statement_number: true,
                }
            },
            sickNote: {
                select: {
                    reason: true
                }
            }
        },
        orderBy: [
            { record_date: "asc" },
            { enrolment: { learner: { last_name: "asc" } } }
        ]
    });

    // Header
    const header = [
        "Date",
        "Learner First Name",
        "Learner Last Name",
        "ID/Passport",
        "Qualification",
        "Status",
        "Notes",
        "Sick Note Reason"
    ].join(",");

    // Rows
    const rows = records.map(r => {
        const learner = r.enrolment.learner;
        const id = learner.national_id || learner.alternate_id || "N/A";

        // Escape fields that might contain commas
        const escape = (str: string | null | undefined) => {
            if (!str) return "";
            if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        return [
            format(r.record_date, "yyyy-MM-dd"),
            escape(learner.first_name),
            escape(learner.last_name),
            escape(id),
            escape(r.enrolment.qualification_title),
            r.status, // Enum, safe usually
            escape(r.notes),
            escape(r.sickNote?.reason)
        ].join(",");
    });

    return [header, ...rows].join("\n");
}

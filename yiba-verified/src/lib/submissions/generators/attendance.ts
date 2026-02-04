import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

interface AttendanceConfig {
    cohort_id: string;
    start_date: string; // ISO Date string
    end_date: string;   // ISO Date string
}

interface AttendanceSnapshot {
    generated_at: string;
    config: AttendanceConfig;
    metrics: {
        total_records: number;
        present_count: number;
        absent_count: number;
        excused_count: number;
        late_count: number;
        attendance_rate: number; // Percentage (0-100)
        unique_learners: number;
    };
    // We can include more detailed breakdown if needed, e.g. per-learner stats
    // For now, aggregate stats are good for the "Metrics Snapshot".
}

/**
 * Generates an attendance snapshot for a submission item.
 * 
 * @param config The configuration for the attendance item (cohort and date range)
 * @returns Object containing the snapshot metrics and a list of included record IDs
 */
export async function generateAttendanceSnapshot(config: AttendanceConfig) {
    const { cohort_id, start_date, end_date } = config;

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    // Ensure we cover the full end date
    endDate.setHours(23, 59, 59, 999);

    // 1. Fetch relevant records
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
            // Only include valid statuses if needed, but usually we want all
        },
        select: {
            record_id: true,
            enrolment_id: true,
            status: true,
        },
    });

    // 2. Compute Metrics
    let present = 0;
    let absent = 0;
    let excused = 0;
    let late = 0;
    const uniqueLearners = new Set<string>();
    const recordIds: string[] = [];

    for (const r of records) {
        recordIds.push(r.record_id);
        uniqueLearners.add(r.enrolment_id);

        switch (r.status) {
            case "PRESENT":
                present++;
                break;
            case "ABSENT":
                absent++;
                break;
            case "EXCUSED":
                excused++;
                break;
            case "LATE":
                late++; // Typically counts as present but noted as late
                break;
        }
    }

    const total = records.length;
    // Attendance Rate: (Present + Late) / Total (excluding Excused? or including?)
    // Standard formula: (Present + Late) / (Total - Excused) or just / Total.
    // Let's use simple: (Present + Late) / Total.
    // If Total is 0, rate is 0.

    const effectiveTotal = total; // Could exclude 'Excused' if policy dictates
    const presentTotal = present + late;
    const rate = effectiveTotal > 0
        ? (presentTotal / effectiveTotal) * 100
        : 0;

    const snapshot: AttendanceSnapshot = {
        generated_at: new Date().toISOString(),
        config,
        metrics: {
            total_records: total,
            present_count: present,
            absent_count: absent,
            excused_count: excused,
            late_count: late,
            attendance_rate: parseFloat(rate.toFixed(2)),
            unique_learners: uniqueLearners.size,
        },
    };

    return {
        metrics_snapshot_json: snapshot,
        included_record_ids_json: recordIds,
    };
}

/**
 * Attendance helpers: recompute Enrolment.attendance_percentage from AttendanceRecords.
 *
 * Formula: (PRESENT + LATE + EXCUSED) / total_records * 100 over the effective date range.
 * EXCUSED counts as attended. If total is 0, attendance_percentage is set to null.
 */
import type { Prisma, PrismaClient } from "@prisma/client";

const ATTENDED_STATUSES = ["PRESENT", "LATE", "EXCUSED"] as const;

/**
 * Recomputes Enrolment.attendance_percentage from AttendanceRecords for the given enrolment.
 * Effective range: start_date to min(today, expected_completion_date ?? today), limited to
 * dates that have at least one AttendanceRecord.
 *
 * @param db - Prisma client or transaction client (use tx when inside prisma.$transaction)
 * @param enrolmentId - Enrolment to recompute
 */
export async function recomputeEnrolmentAttendancePercentage(
  db: PrismaClient | Prisma.TransactionClient,
  enrolmentId: string
): Promise<void> {
  const enrolment = await db.enrolment.findUnique({
    where: { enrolment_id: enrolmentId },
    select: { start_date: true, expected_completion_date: true },
  });

  if (!enrolment) return;

  const end = enrolment.expected_completion_date
    ? new Date(enrolment.expected_completion_date)
    : new Date();
  const today = new Date();
  const effectiveEnd = end > today ? today : end;
  const effectiveStart = new Date(enrolment.start_date);

  const records = await db.attendanceRecord.findMany({
    where: {
      enrolment_id: enrolmentId,
      record_date: { gte: effectiveStart, lte: effectiveEnd },
    },
    select: { status: true },
  });

  const total = records.length;
  const counted = records.filter((r) => ATTENDED_STATUSES.includes(r.status as (typeof ATTENDED_STATUSES)[number])).length;
  const percentage = total > 0 ? Math.round((counted / total) * 100 * 100) / 100 : null;

  await db.enrolment.update({
    where: { enrolment_id: enrolmentId },
    data: { attendance_percentage: percentage },
  });
}

export { ATTENDED_STATUSES };

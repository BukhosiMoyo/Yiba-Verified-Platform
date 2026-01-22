/**
 * GET /api/institution/attendance - List attendance records (institution-scoped)
 * POST /api/institution/attendance - Create or upsert attendance record(s)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mutateWithAudit } from "@/server/mutations/mutate";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";
import { recomputeEnrolmentAttendancePercentage } from "@/lib/attendance";
import type { AttendanceStatus } from "@prisma/client";

// GET: list with filters enrolment_id, from, to, status
export async function GET(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!hasCap(ctx.role, "ATTENDANCE_VIEW")) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "ATTENDANCE_VIEW required", 403));
    }

    if ((ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") && !ctx.institutionId) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "Institution context required", 403));
    }

    const sp = request.nextUrl.searchParams;
    const enrolmentId = sp.get("enrolment_id") ?? undefined;
    const from = sp.get("from");
    const to = sp.get("to");
    const status = sp.get("status") as AttendanceStatus | undefined;
    const limit = Math.min(parseInt(sp.get("limit") || "100", 10), 500);
    const offset = parseInt(sp.get("offset") || "0", 10);

    const where: Record<string, unknown> = {};

    if (enrolmentId) where.enrolment_id = enrolmentId;
    if (status) where.status = status;
    if (from || to) {
      where.record_date = {};
      if (from) (where.record_date as Record<string, Date>).gte = new Date(from);
      if (to) (where.record_date as Record<string, Date>).lte = new Date(to);
    }

    // Institution scope: only enrolments from user's institution (or all for PLATFORM_ADMIN)
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      where.enrolment = { institution_id: ctx.institutionId! };
    }

    const [items, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        select: {
          record_id: true,
          enrolment_id: true,
          record_date: true,
          status: true,
          marked_at: true,
          marked_by: true,
          notes: true,
          enrolment: { select: { learner: { select: { first_name: true, last_name: true } }, qualification_title: true } },
          markedByUser: { select: { first_name: true, last_name: true } },
          sickNote: { select: { reason: true, document_id: true } },
        },
        orderBy: [{ record_date: "desc" }, { marked_at: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.attendanceRecord.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((r) => ({
        record_id: r.record_id,
        enrolment_id: r.enrolment_id,
        record_date: r.record_date.toISOString().slice(0, 10),
        status: r.status,
        marked_at: r.marked_at.toISOString(),
        marked_by: r.marked_by,
        notes: r.notes,
        learner_name: r.enrolment.learner ? `${r.enrolment.learner.first_name} ${r.enrolment.learner.last_name}` : null,
        qualification_title: r.enrolment.qualification_title,
        marked_by_name: r.markedByUser ? `${r.markedByUser.first_name} ${r.markedByUser.last_name}` : null,
        sick_note: r.sickNote ? { reason: r.sickNote.reason, has_attachment: !!r.sickNote.document_id } : null,
      })),
      total,
    });
  } catch (e) {
    return fail(e);
  }
}

// POST: single record. Body: { enrolment_id, record_date, status, notes?, sick_note?: { reason } }
export async function POST(request: NextRequest) {
  try {
    const { ctx } = await requireAuth(request);

    if (!hasCap(ctx.role, "ATTENDANCE_CAPTURE")) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "ATTENDANCE_CAPTURE required", 403));
    }

    const body = await request.json().catch(() => ({}));
    const enrolmentId = body.enrolment_id as string | undefined;
    const recordDate = body.record_date as string | undefined;
    const status = body.status as AttendanceStatus | undefined;
    const notes = (body.notes as string | undefined) ?? null;
    const sickNote = body.sick_note as { reason?: string } | undefined;

    if (!enrolmentId || !recordDate || !status) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "enrolment_id, record_date, status required", 400));
    }
    const valid: AttendanceStatus[] = ["PRESENT", "ABSENT", "EXCUSED", "LATE"];
    if (!valid.includes(status)) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "status must be PRESENT, ABSENT, EXCUSED, or LATE", 400));
    }

    const recordDateOnly = new Date(recordDate);
    recordDateOnly.setHours(0, 0, 0, 0);

    const enrolment = await prisma.enrolment.findFirst({
      where: { enrolment_id: enrolmentId, deleted_at: null },
      select: { institution_id: true },
    });
    if (!enrolment) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Enrolment not found", 404));
    }
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId || ctx.institutionId !== enrolment.institution_id) {
        return fail(new AppError(ERROR_CODES.FORBIDDEN, "Enrolment not in your institution", 403));
      }
    }

    const rec = await mutateWithAudit({
      ctx,
      entityType: "ATTENDANCE_RECORD",
      changeType: "CREATE",
      fieldName: "record_id",
      institutionId: enrolment.institution_id,
      reason: body.reason ?? null,
      assertCan: async () => {
        // Already checked ATTENDANCE_CAPTURE and institution scope above
      },
      mutation: async (tx) => {
        const existing = await tx.attendanceRecord.findFirst({
          where: { enrolment_id: enrolmentId, record_date: recordDateOnly },
          select: { record_id: true, sickNote: { select: { sick_note_id: true } } },
        });

        let record;
        if (existing) {
          record = await tx.attendanceRecord.update({
            where: { record_id: existing.record_id },
            data: { status, notes, marked_at: new Date(), marked_by: ctx.userId },
          });
          if (existing.sickNote) {
            await tx.sickNote.delete({ where: { sick_note_id: existing.sickNote.sick_note_id } });
          }
        } else {
          record = await tx.attendanceRecord.create({
            data: {
              enrolment_id: enrolmentId,
              record_date: recordDateOnly,
              status,
              notes,
              marked_by: ctx.userId,
            },
          });
        }

        if (sickNote?.reason && (status === "ABSENT" || status === "EXCUSED")) {
          await tx.sickNote.create({
            data: { record_id: record.record_id, reason: sickNote.reason.trim() || "No reason provided" },
          });
        }

        await recomputeEnrolmentAttendancePercentage(tx, enrolmentId);
        return record;
      },
    });

    const withSick = await prisma.attendanceRecord.findUnique({
      where: { record_id: rec.record_id },
      select: { sickNote: { select: { reason: true, document_id: true } } },
    });

    return NextResponse.json(
      {
        record_id: rec.record_id,
        enrolment_id: rec.enrolment_id,
        record_date: rec.record_date.toISOString().slice(0, 10),
        status: rec.status,
        notes: rec.notes,
        sick_note: withSick?.sickNote ? { reason: withSick.sickNote.reason, has_attachment: !!withSick.sickNote.document_id } : null,
      },
      { status: 201 }
    );
  } catch (e) {
    return fail(e);
  }
}

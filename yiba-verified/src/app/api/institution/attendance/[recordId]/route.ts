/**
 * GET /api/institution/attendance/[recordId] - Get one record
 * PATCH /api/institution/attendance/[recordId] - Update status, notes, sick_note
 * DELETE /api/institution/attendance/[recordId] - Delete record (cascades SickNote), recompute %
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

async function getRecordAndScope(recordId: string, ctx: { role: string; institutionId: string | null }) {
  const r = await prisma.attendanceRecord.findUnique({
    where: { record_id: recordId },
    select: {
      record_id: true,
      enrolment_id: true,
      record_date: true,
      status: true,
      marked_at: true,
      marked_by: true,
      notes: true,
      enrolment: { select: { institution_id: true, learner: { select: { first_name: true, last_name: true } }, qualification_title: true } },
      markedByUser: { select: { first_name: true, last_name: true } },
      sickNote: { select: { reason: true, document_id: true } },
    },
  });
  if (!r) return null;
  if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
    if (!ctx.institutionId || r.enrolment.institution_id !== ctx.institutionId) return null;
  }
  return r;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    if (!hasCap(ctx.role, "ATTENDANCE_VIEW")) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "ATTENDANCE_VIEW required", 403));
    }
    const { recordId } = await params;
    const r = await getRecordAndScope(recordId, ctx);
    if (!r) return fail(new AppError(ERROR_CODES.NOT_FOUND, "Record not found", 404));
    return NextResponse.json({
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
    });
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    if (!hasCap(ctx.role, "ATTENDANCE_CAPTURE")) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "ATTENDANCE_CAPTURE required", 403));
    }
    const { recordId } = await params;
    const existing = await getRecordAndScope(recordId, ctx);
    if (!existing) return fail(new AppError(ERROR_CODES.NOT_FOUND, "Record not found", 404));

    const body = await request.json().catch(() => ({}));
    const status = body.status as AttendanceStatus | undefined;
    const notes = body.notes !== undefined ? (body.notes as string | null) : undefined;
    const sickNote = body.sick_note as { reason?: string } | undefined;

    const valid: AttendanceStatus[] = ["PRESENT", "ABSENT", "EXCUSED", "LATE"];
    if (status !== undefined && !valid.includes(status)) {
      return fail(new AppError(ERROR_CODES.VALIDATION_ERROR, "status must be PRESENT, ABSENT, EXCUSED, or LATE", 400));
    }

    const rec = await mutateWithAudit({
      ctx,
      entityType: "ATTENDANCE_RECORD",
      entityId: recordId,
      changeType: "UPDATE",
      fieldName: "status",
      oldValue: existing.status,
      newValue: status ?? existing.status,
      institutionId: existing.enrolment.institution_id,
      reason: (body.reason as string) ?? null,
      assertCan: async () => {},
      mutation: async (tx) => {
        const data: { status?: AttendanceStatus; notes?: string | null; marked_at?: Date; marked_by?: string } = {};
        if (status !== undefined) data.status = status;
        if (notes !== undefined) data.notes = notes;
        data.marked_at = new Date();
        data.marked_by = ctx.userId;

        const updated = await tx.attendanceRecord.update({
          where: { record_id: recordId },
          data,
        });

        const finalStatus = updated.status;
        const existingSick = await tx.sickNote.findUnique({ where: { record_id: recordId } });

        if (finalStatus === "PRESENT" || finalStatus === "LATE") {
          if (existingSick) await tx.sickNote.delete({ where: { record_id: recordId } });
        } else if (finalStatus === "ABSENT" || finalStatus === "EXCUSED") {
          if (sickNote?.reason !== undefined) {
            if (existingSick) {
              await tx.sickNote.update({
                where: { record_id: recordId },
                data: { reason: sickNote.reason.trim() || "No reason provided" },
              });
            } else {
              await tx.sickNote.create({
                data: { record_id: recordId, reason: sickNote.reason.trim() || "No reason provided" },
              });
            }
          }
        }

        await recomputeEnrolmentAttendancePercentage(tx, updated.enrolment_id);
        return updated;
      },
    });

    const withSick = await prisma.attendanceRecord.findUnique({
      where: { record_id: rec.record_id },
      select: { sickNote: { select: { reason: true, document_id: true } } },
    });

    return NextResponse.json({
      record_id: rec.record_id,
      enrolment_id: rec.enrolment_id,
      record_date: rec.record_date.toISOString().slice(0, 10),
      status: rec.status,
      notes: rec.notes,
      sick_note: withSick?.sickNote ? { reason: withSick.sickNote.reason, has_attachment: !!withSick.sickNote.document_id } : null,
    });
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    if (!hasCap(ctx.role, "ATTENDANCE_CAPTURE")) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "ATTENDANCE_CAPTURE required", 403));
    }
    const { recordId } = await params;
    const existing = await getRecordAndScope(recordId, ctx);
    if (!existing) return fail(new AppError(ERROR_CODES.NOT_FOUND, "Record not found", 404));
    const enrolmentId = existing.enrolment_id;

    await mutateWithAudit({
      ctx,
      entityType: "ATTENDANCE_RECORD",
      entityId: recordId,
      changeType: "DELETE",
      fieldName: "record_id",
      oldValue: existing.status,
      institutionId: existing.enrolment.institution_id,
      reason: (await request.json().catch(() => ({}))).reason ?? null,
      assertCan: async () => {},
      mutation: async (tx) => {
        await tx.attendanceRecord.delete({ where: { record_id: recordId } });
        await recomputeEnrolmentAttendancePercentage(tx, enrolmentId);
        return { deleted: true };
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return fail(e);
  }
}

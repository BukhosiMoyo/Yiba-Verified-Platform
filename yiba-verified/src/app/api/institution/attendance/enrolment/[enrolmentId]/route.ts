/**
 * GET /api/institution/attendance/enrolment/[enrolmentId] - List attendance records for one enrolment
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/context";
import { fail } from "@/lib/api/response";
import { AppError, ERROR_CODES } from "@/lib/api/errors";
import { hasCap } from "@/lib/capabilities";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ enrolmentId: string }> }
) {
  try {
    const { ctx } = await requireAuth(request);
    if (!hasCap(ctx.role, "ATTENDANCE_VIEW")) {
      return fail(new AppError(ERROR_CODES.FORBIDDEN, "ATTENDANCE_VIEW required", 403));
    }

    const { enrolmentId } = await params;
    const sp = request.nextUrl.searchParams;
    const from = sp.get("from");
    const to = sp.get("to");

    const enrolment = await prisma.enrolment.findFirst({
      where: { enrolment_id: enrolmentId, deleted_at: null },
      select: { institution_id: true, qualification_title: true, learner: { select: { first_name: true, last_name: true } } },
    });
    if (!enrolment) {
      return fail(new AppError(ERROR_CODES.NOT_FOUND, "Enrolment not found", 404));
    }
    if (ctx.role === "INSTITUTION_ADMIN" || ctx.role === "INSTITUTION_STAFF") {
      if (!ctx.institutionId || ctx.institutionId !== enrolment.institution_id) {
        return fail(new AppError(ERROR_CODES.FORBIDDEN, "Enrolment not in your institution", 403));
      }
    }

    const where: { enrolment_id: string; record_date?: { gte?: Date; lte?: Date } } = { enrolment_id: enrolmentId };
    if (from || to) {
      where.record_date = {};
      if (from) where.record_date!.gte = new Date(from);
      if (to) where.record_date!.lte = new Date(to);
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      select: {
        record_id: true,
        record_date: true,
        status: true,
        notes: true,
        marked_at: true,
        markedByUser: { select: { first_name: true, last_name: true } },
        sickNote: { select: { reason: true, document_id: true } },
      },
      orderBy: { record_date: "desc" },
    });

    return NextResponse.json({
      enrolment_id: enrolmentId,
      qualification_title: enrolment.qualification_title,
      learner_name: enrolment.learner ? `${enrolment.learner.first_name} ${enrolment.learner.last_name}` : null,
      items: records.map((r) => ({
        record_id: r.record_id,
        record_date: r.record_date.toISOString().slice(0, 10),
        status: r.status,
        notes: r.notes,
        marked_at: r.marked_at.toISOString(),
        marked_by_name: r.markedByUser ? `${r.markedByUser.first_name} ${r.markedByUser.last_name}` : null,
        sick_note: r.sickNote ? { reason: r.sickNote.reason, has_attachment: !!r.sickNote.document_id } : null,
      })),
    });
  } catch (e) {
    return fail(e);
  }
}

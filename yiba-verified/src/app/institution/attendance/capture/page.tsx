import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardCheck, ArrowLeft } from "lucide-react";
import { AttendanceCaptureClient } from "@/components/institution/AttendanceCaptureClient";
import { EmptyState } from "@/components/shared/EmptyState";

interface PageProps {
  searchParams: { date?: string };
}

export default async function InstitutionAttendanceCapturePage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const institutionId = session.user.institutionId;

  if ((role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") && !institutionId) {
    return (
      <div className="p-4 md:p-8">
        <EmptyState
          title="No institution"
          description="Your account is not linked to an institution."
          icon={<ClipboardCheck className="h-6 w-6" strokeWidth={1.5} />}
        />
      </div>
    );
  }

  const raw = searchParams.date || new Date().toISOString().slice(0, 10);
  const d = new Date(raw);
  const date = isNaN(d.getTime()) ? new Date() : d;
  const dateStr = date.toISOString().slice(0, 10);

  const enrolWhere: Record<string, unknown> = {
    deleted_at: null,
    enrolment_status: "ACTIVE",
    start_date: { lte: date },
    OR: [{ expected_completion_date: null }, { expected_completion_date: { gte: date } }],
  };
  if (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") {
    (enrolWhere as any).institution_id = institutionId;
  }

  const recWhere: Record<string, unknown> = { record_date: date };
  if (role !== "PLATFORM_ADMIN" && institutionId) {
    recWhere.enrolment = { institution_id: institutionId };
  }

  const [enrolments, records] = await Promise.all([
    prisma.enrolment.findMany({
      where: enrolWhere,
      select: {
        enrolment_id: true,
        qualification_title: true,
        learner: { select: { first_name: true, last_name: true } },
      },
      orderBy: { created_at: "asc" },
    }),
    prisma.attendanceRecord.findMany({
      where: recWhere,
      select: {
        record_id: true,
        enrolment_id: true,
        status: true,
        notes: true,
        sickNote: { select: { reason: true, document_id: true } },
      },
    }),
  ]);

  const recordsByEnrolmentId: Record<string, { record_id: string; status: string; notes: string | null; sick_note: { reason: string; has_attachment: boolean } | null }> = {};
  for (const r of records) {
    recordsByEnrolmentId[r.enrolment_id] = {
      record_id: r.record_id,
      status: r.status,
      notes: r.notes,
      sick_note: r.sickNote
        ? { reason: r.sickNote.reason, has_attachment: !!r.sickNote.document_id }
        : null,
    };
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Link
          href="/institution/attendance"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to register
        </Link>
      </div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-6 py-6 md:px-8 md:py-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_50%)]" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <ClipboardCheck className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Capture attendance</h1>
            <p className="mt-0.5 text-emerald-100 text-sm">Mark present, absent, excused, or late. Add sick notes for absences.</p>
          </div>
        </div>
      </div>

      <AttendanceCaptureClient
        date={dateStr}
        enrolments={enrolments}
        recordsByEnrolmentId={recordsByEnrolmentId}
      />
    </div>
  );
}

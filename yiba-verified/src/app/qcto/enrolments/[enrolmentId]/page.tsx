import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canReadForQCTO } from "@/lib/api/qctoAccess";
import type { ApiContext } from "@/lib/api/context";
import { canAccessQctoData } from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Building2, User, GraduationCap, ClipboardCheck } from "lucide-react";
import { AcademicSummaryCard } from "@/components/qcto/AcademicSummaryCard";
import { AssessmentResultsDisplay } from "@/components/qcto/AssessmentResultsDisplay";
import { ModuleCompletionDisplay } from "@/components/qcto/ModuleCompletionDisplay";

interface PageProps {
  params: Promise<{ enrolmentId: string }>;
}

/**
 * QCTO Enrolment Details Page
 *
 * View enrolment linked to a submission (SUBMITTED, UNDER_REVIEW, or APPROVED).
 * - QCTO_USER: can view if enrolment is in a submission/request QCTO can access
 * - PLATFORM_ADMIN: can view any enrolment
 */
export default async function QCTOEnrolmentDetailPage({ params }: PageProps) {
  const { enrolmentId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (!canAccessQctoData(role)) redirect("/unauthorized");

  const ctx: ApiContext = {
    userId: (session.user as { userId?: string }).userId ?? (session.user as { id?: string }).id ?? "",
    role: role!,
    institutionId: (session.user as { institutionId?: string }).institutionId ?? null,
    qctoId: (session.user as { qctoId?: string | null }).qctoId ?? null,
  };

  const canRead = await canReadForQCTO(ctx, "ENROLMENT", enrolmentId);
  if (!canRead) notFound();

  const enrolment = await prisma.enrolment.findUnique({
    where: { enrolment_id: enrolmentId, deleted_at: null },
    select: {
      enrolment_id: true,
      learner_id: true,
      institution_id: true,
      qualification_id: true,
      qualification_title: true,
      start_date: true,
      expected_completion_date: true,
      enrolment_status: true,
      attendance_percentage: true,
      assessment_centre_code: true,
      readiness_status: true,
      flc_status: true,
      statement_number: true,
      created_at: true,
      updated_at: true,
      learner: {
        select: {
          learner_id: true,
          national_id: true,
          first_name: true,
          last_name: true,
          birth_date: true,
        },
      },
      qualification: {
        select: {
          qualification_id: true,
          name: true,
          code: true,
        },
      },
      institution: {
        select: {
          legal_name: true,
          trading_name: true,
        },
      },
    },
  });

  if (!enrolment) notFound();

  const records = await prisma.attendanceRecord.findMany({
    where: { enrolment_id: enrolmentId },
    select: {
      record_id: true,
      record_date: true,
      status: true,
      sickNote: { select: { reason: true, document_id: true } },
    },
    orderBy: { record_date: "desc" },
    take: 100,
  });

  const count = { PRESENT: 0, ABSENT: 0, EXCUSED: 0, LATE: 0 };
  for (const r of records) count[r.status as keyof typeof count]++;

  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) : "N/A";
  const formatDateTime = (d: Date | null) =>
    d
      ? new Date(d).toLocaleDateString("en-ZA", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const statusClass: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    TRANSFERRED: "bg-amber-100 text-amber-800",
    ARCHIVED: "bg-gray-100 text-gray-800",
  };
  const attStatusClass: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-800",
    ABSENT: "bg-red-100 text-red-800",
    EXCUSED: "bg-amber-100 text-amber-800",
    LATE: "bg-blue-100 text-blue-800",
  };
  const inst = enrolment.institution;

  return (
    <div className="space-y-6">
      <Link
        href="/qcto/submissions"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to submissions
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enrolment</h1>
        <p className="text-gray-600 mt-1">View enrolment details from a submission</p>
      </div>

      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle>
            {enrolment.qualification?.name || enrolment.qualification_title || "Enrolment"}
          </CardTitle>
          <CardDescription>
            {enrolment.learner?.first_name} {enrolment.learner?.last_name}
            {inst && ` · ${inst.trading_name || inst.legal_name}`}
          </CardDescription>
          <div className="pt-1">
            <Badge className={statusClass[enrolment.enrolment_status] || "bg-gray-100 text-gray-800"}>
              {enrolment.enrolment_status || "—"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Institution</p>
              <p className="mt-0.5 flex items-center gap-2 text-[15px] text-gray-900">
                <Building2 className="h-4 w-4 text-gray-400 shrink-0" aria-hidden />
                {inst?.trading_name || inst?.legal_name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Learner</p>
              <p className="mt-0.5 flex items-center gap-2 text-[15px] text-gray-900">
                <User className="h-4 w-4 text-gray-400 shrink-0" aria-hidden />
                {enrolment.learner?.first_name} {enrolment.learner?.last_name} ({enrolment.learner?.national_id || "—"})
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Qualification</p>
              <p className="mt-0.5 flex items-center gap-2 text-[15px] text-gray-900">
                <GraduationCap className="h-4 w-4 text-gray-400 shrink-0" aria-hidden />
                {enrolment.qualification?.name || enrolment.qualification_title || "—"}
                {enrolment.qualification?.code && ` (${enrolment.qualification.code})`}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Start date</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{formatDate(enrolment.start_date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Expected completion</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{formatDate(enrolment.expected_completion_date)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attendance</p>
              <p className="mt-0.5 text-[15px] text-gray-900">
                {enrolment.attendance_percentage != null ? `${enrolment.attendance_percentage}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{formatDateTime(enrolment.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Updated</p>
              <p className="mt-0.5 text-[15px] text-gray-900">{formatDateTime(enrolment.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-gray-500" />
            Attendance register
          </CardTitle>
          <CardDescription>
            Summary: {enrolment.attendance_percentage != null ? `${enrolment.attendance_percentage}%` : "—"} · Present: {count.PRESENT} · Absent: {count.ABSENT} · Excused: {count.EXCUSED} · Late: {count.LATE}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Sick note / reason</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.record_id} className="border-b last:border-0">
                      <td className="py-2 px-2">{formatDate(r.record_date)}</td>
                      <td className="py-2 px-2">
                        <Badge className={attStatusClass[r.status] || ""}>{r.status}</Badge>
                      </td>
                      <td className="py-2 px-2">
                        {r.sickNote ? (
                          <span>
                            {r.sickNote.reason}
                            {r.sickNote.document_id ? " (attachment on file)" : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AcademicSummaryCard enrolmentId={enrolmentId} />

      <AssessmentResultsDisplay enrolmentId={enrolmentId} />

      <ModuleCompletionDisplay enrolmentId={enrolmentId} />
    </div>
  );
}

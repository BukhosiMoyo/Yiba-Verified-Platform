import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  EXCUSED: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  LATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

export default async function StudentAttendanceEnrolmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ enrolmentId: string }>;
  searchParams: { from?: string; to?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { enrolmentId } = await params;
  const userId = session.user.userId;

  const learner = await prisma.learner.findFirst({
    where: { user_id: userId, deleted_at: null },
    select: { learner_id: true },
  });
  if (!learner) redirect("/student/attendance");

  const enrolment = await prisma.enrolment.findFirst({
    where: { enrolment_id: enrolmentId, learner_id: learner.learner_id, deleted_at: null },
    select: {
      enrolment_id: true,
      qualification_title: true,
      attendance_percentage: true,
      institution: { select: { trading_name: true, legal_name: true } },
    },
  });

  if (!enrolment) notFound();

  const where: { enrolment_id: string; record_date?: { gte?: Date; lte?: Date } } = { enrolment_id: enrolmentId };
  if (searchParams.from || searchParams.to) {
    where.record_date = {};
    if (searchParams.from) where.record_date!.gte = new Date(searchParams.from);
    if (searchParams.to) where.record_date!.lte = new Date(searchParams.to);
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    select: {
      record_id: true,
      record_date: true,
      status: true,
      sickNote: { select: { reason: true, document_id: true } },
    },
    orderBy: { record_date: "desc" },
    take: 180,
  });

  const inst = enrolment.institution?.trading_name || enrolment.institution?.legal_name || "—";

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link href="/student/attendance" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" />
        Back to attendance
      </Link>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-6 py-6 md:px-8 md:py-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_50%)]" aria-hidden />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Activity className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Attendance — {enrolment.qualification_title}</h1>
            <p className="mt-0.5 text-emerald-100 text-sm">{inst}</p>
            {enrolment.attendance_percentage != null && (
              <p className="mt-1 text-emerald-100 text-sm">Overall: {Number(enrolment.attendance_percentage)}%</p>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Attendance history</CardTitle>
          <CardDescription>
            {records.length} record{records.length !== 1 ? "s" : ""}. Attended = Present or Late. Excused absences show a reason; 📎 = sick note on file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No attendance records yet for this enrolment.</p>
            </div>
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
                  {records.map((r) => {
                    const sn = r.sickNote;
                    const label = r.status === "PRESENT" || r.status === "LATE" ? "Attended" : r.status === "EXCUSED" ? "Excused" : "Absent";
                    return (
                      <tr key={r.record_id} className="border-b last:border-0">
                        <td className="py-2 px-2">{new Date(r.record_date).toLocaleDateString("en-ZA")}</td>
                        <td className="py-2 px-2">
                          <Badge className={STATUS_COLORS[r.status] || ""}>{label}</Badge>
                        </td>
                        <td className="py-2 px-2">
                          {sn ? (
                            <span>
                              {sn.reason}
                              {sn.document_id ? " (Sick note on file)" : ""}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

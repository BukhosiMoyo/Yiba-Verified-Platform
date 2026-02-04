import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardCheck, Plus, Calendar, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  EXCUSED: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  LATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

interface PageProps {
  searchParams: { from?: string; to?: string; status?: string; enrolment_id?: string };
}

export default async function InstitutionAttendancePage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const institutionId = session.user.institutionId;
  const where: any = {};

  if (role === "INSTITUTION_ADMIN" || role === "INSTITUTION_STAFF") {
    if (!institutionId) {
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
    where.enrolment = { institution_id: institutionId };
  } else if (role === "FACILITATOR") {
    // Facilitators can only see records for their cohorts
    const facilitator = await prisma.facilitator.findFirst({ where: { user_id: session.user.userId } });
    if (!facilitator) {
      return <div className="p-8">Access Denied: No facilitator profile found.</div>;
    }
    where.enrolment = {
      cohort: {
        facilitators: {
          some: { id: facilitator.id }
        }
      }
    };
  }

  const from = searchParams.from;
  const to = searchParams.to;
  const status = searchParams.status;
  const enrolmentId = searchParams.enrolment_id;

  if (from || to) {
    (where as any).record_date = {};
    if (from) (where.record_date as any).gte = new Date(from);
    if (to) (where.record_date as any).lte = new Date(to);
  }
  if (status) (where as any).status = status;
  if (enrolmentId) (where as any).enrolment_id = enrolmentId;

  const records = await prisma.attendanceRecord.findMany({
    where,
    select: {
      record_id: true,
      enrolment_id: true,
      record_date: true,
      status: true,
      marked_at: true,
      notes: true,
      enrolment: {
        select: {
          qualification_title: true,
          learner: { select: { first_name: true, last_name: true } },
        },
      },
      markedByUser: { select: { first_name: true, last_name: true } },
      sickNote: { select: { reason: true, document_id: true } },
    },
    orderBy: [{ record_date: "desc" }, { marked_at: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-6 py-8 md:px-8 md:py-10 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_50%)]" aria-hidden />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <ClipboardCheck className="h-7 w-7" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Attendance Register</h1>
              <p className="mt-1 text-emerald-100 text-sm md:text-base">
                View and capture daily attendance. Attach sick notes for excused absences.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/institution/attendance/cohorts">
              <Button variant="secondary" className="gap-2">
                <List className="h-4 w-4" />
                Manage Cohorts
              </Button>
            </Link>
            <Link href="/institution/attendance/capture">
              <Button className="bg-white text-emerald-700 hover:bg-emerald-50">
                <Plus className="h-4 w-4 mr-2" />
                Capture daily
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent records</CardTitle>
          <CardDescription>
            {records.length} record{records.length !== 1 ? "s" : ""} found.
            Filter by date range or status in the URL (e.g. ?from=2025-01-01&to=2025-01-31&status=ABSENT).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No attendance records yet.</p>
              <Link href="/institution/attendance/capture">
                <Button variant="outline" className="mt-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Capture attendance
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Learner</th>
                    <th className="text-left py-2 px-2">Qualification</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Sick note</th>
                    <th className="text-left py-2 px-2">Marked by</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.record_id} className="border-b last:border-0">
                      <td className="py-2 px-2">{new Date(r.record_date).toLocaleDateString("en-ZA")}</td>
                      <td className="py-2 px-2">
                        {r.enrolment.learner
                          ? `${r.enrolment.learner.first_name} ${r.enrolment.learner.last_name}`
                          : "—"}
                      </td>
                      <td className="py-2 px-2">{r.enrolment.qualification_title}</td>
                      <td className="py-2 px-2">
                        <Badge className={STATUS_COLORS[r.status] || ""}>{r.status}</Badge>
                      </td>
                      <td className="py-2 px-2">
                        {r.sickNote ? (
                          <span title={r.sickNote.reason}>
                            {r.sickNote.reason.slice(0, 30)}
                            {r.sickNote.reason.length > 30 ? "…" : ""}
                            {r.sickNote.document_id ? " 📎" : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {r.markedByUser ? `${r.markedByUser.first_name} ${r.markedByUser.last_name}` : "—"}
                      </td>
                      <td className="py-2 px-2">
                        <Link
                          href={`/institution/attendance/enrolment/${r.enrolment_id}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <List className="h-3.5 w-3.5" />
                          Register
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

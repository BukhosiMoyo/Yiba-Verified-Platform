import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Activity, List } from "lucide-react";

/**
 * Student attendance: shows attendance by enrolment (Enrolment.attendance_percentage).
 * Requires STUDENT role (enforced by layout). ATTENDANCE_VIEW is required for the nav item.
 */
export default async function StudentAttendancePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.userId;

  const learner = await prisma.learner.findFirst({
    where: { user_id: userId, deleted_at: null },
    select: { learner_id: true },
  });

  if (!learner) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground mt-2">
            Your attendance across enrolments
          </p>
        </div>
        <EmptyState
          title="No learner profile"
          description="Your account is not linked to a learner record. Contact your institution to set up your profile."
          icon={<Activity className="h-6 w-6" strokeWidth={1.5} />}
        />
      </div>
    );
  }

  const enrolments = await prisma.enrolment.findMany({
    where: { learner_id: learner.learner_id, deleted_at: null },
    select: {
      enrolment_id: true,
      qualification_title: true,
      enrolment_status: true,
      attendance_percentage: true,
      qualification: { select: { name: true, code: true } },
      institution: { select: { trading_name: true, legal_name: true } },
    },
    orderBy: { enrolment_status: "asc" }, // ACTIVE first
  });

  // Only show enrolments that have attendance data, or all with a note for those without
  const withAttendance = enrolments.filter((e) => e.attendance_percentage != null);
  const withoutAttendance = enrolments.filter((e) => e.attendance_percentage == null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Your attendance across enrolments
        </p>
      </div>

      {enrolments.length === 0 ? (
        <EmptyState
          title="No enrolments yet"
          description="You have no enrolments. Attendance will appear here when your institution enrols you and records attendance."
          icon={<Activity className="h-6 w-6" strokeWidth={1.5} />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {withAttendance.map((e) => {
            const pct = Number(e.attendance_percentage);
            const qual = e.qualification?.name || e.qualification_title;
            const inst = e.institution?.trading_name || e.institution?.legal_name || "—";
            return (
              <Card key={e.enrolment_id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{qual}</CardTitle>
                  <CardDescription>{inst}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{pct}%</span>
                    <span className="text-muted-foreground text-sm">attendance</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <Link href={`/student/attendance/enrolment/${e.enrolment_id}`}>
                    <Button variant="ghost" size="sm" className="mt-2 -ml-2">
                      <List className="h-3.5 w-3.5 mr-1.5" />
                      View details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
          {withoutAttendance.map((e) => {
            const qual = e.qualification?.name || e.qualification_title;
            const inst = e.institution?.trading_name || e.institution?.legal_name || "—";
            return (
              <Card key={e.enrolment_id} className="opacity-75">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{qual}</CardTitle>
                  <CardDescription>{inst}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No attendance recorded yet</p>
                  <Link href={`/student/attendance/enrolment/${e.enrolment_id}`}>
                    <Button variant="ghost" size="sm" className="mt-2 -ml-2">
                      <List className="h-3.5 w-3.5 mr-1.5" />
                      View details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

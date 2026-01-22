import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { GraduationCap } from "lucide-react";

/**
 * Student enrolments: shows enrolments for the learner linked to the current user.
 * Requires STUDENT role (enforced by layout).
 */
export default async function StudentEnrolmentsPage() {
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
          <h1 className="text-2xl md:text-3xl font-bold">My Enrolments</h1>
          <p className="text-muted-foreground mt-2">
            Your current and past enrolments
          </p>
        </div>
        <EmptyState
          title="No learner profile"
          description="Your account is not linked to a learner record. Contact your institution to set up your profile and enrolments."
          icon={<GraduationCap className="h-6 w-6" strokeWidth={1.5} />}
        />
      </div>
    );
  }

  const enrolments = await prisma.enrolment.findMany({
    where: { learner_id: learner.learner_id, deleted_at: null },
    select: {
      enrolment_id: true,
      qualification_title: true,
      start_date: true,
      expected_completion_date: true,
      enrolment_status: true,
      attendance_percentage: true,
      qualification: { select: { name: true, code: true } },
      institution: { select: { trading_name: true, legal_name: true } },
    },
    orderBy: { start_date: "desc" },
  });

  const formatDate = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "—";

  const statusLabels: Record<string, string> = {
    ACTIVE: "Active",
    COMPLETED: "Completed",
    TRANSFERRED: "Transferred",
    ARCHIVED: "Archived",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">My Enrolments</h1>
        <p className="text-muted-foreground mt-2">
          Your current and past enrolments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolments</CardTitle>
          <CardDescription>
            {enrolments.length} enrolment{enrolments.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Qualification</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Start date</TableHead>
                <TableHead>Expected completion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12">
                    <EmptyState
                      title="No enrolments yet"
                      description="You have no enrolments. Enrolments will appear here when your institution adds you to a qualification."
                      icon={<GraduationCap className="h-6 w-6" strokeWidth={1.5} />}
                      variant="default"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                enrolments.map((e) => (
                  <TableRow key={e.enrolment_id}>
                    <TableCell className="font-medium">
                      {e.qualification?.name || e.qualification_title}
                      {e.qualification?.code && (
                        <span className="text-xs text-muted-foreground ml-1">({e.qualification.code})</span>
                      )}
                    </TableCell>
                    <TableCell>{e.institution?.trading_name || e.institution?.legal_name || "—"}</TableCell>
                    <TableCell>{formatDate(e.start_date)}</TableCell>
                    <TableCell>{formatDate(e.expected_completion_date)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          e.enrolment_status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : e.enrolment_status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800"
                            : e.enrolment_status === "TRANSFERRED"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {statusLabels[e.enrolment_status] || e.enrolment_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {e.attendance_percentage != null
                        ? `${Number(e.attendance_percentage)}%`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
        </CardContent>
      </Card>
    </div>
  );
}

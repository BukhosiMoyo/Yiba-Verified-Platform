"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, GraduationCap, TrendingUp, Award, BookOpen } from "lucide-react";
import Link from "next/link";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";

interface LearnerAcademicHistoryProps {
  learnerId: string;
}

export function LearnerAcademicHistory({ learnerId }: LearnerAcademicHistoryProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAcademicHistory();
  }, [learnerId]);

  const fetchAcademicHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/qcto/learners/${learnerId}/academic-history`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch academic history");
      }
      const data = await res.json();
      setData(data);
    } catch (e: any) {
      setError(e.message || "An error occurred");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return "—";
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle>Academic History</CardTitle>
          <CardDescription>Loading academic history...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle>Academic History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary || {};
  const enrolments = data?.enrolments || [];

  return (
    <>
      {/* Summary Card */}
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-gray-500" />
            Academic Summary
          </CardTitle>
          <CardDescription>Overall performance across all qualifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total Enrolments
              </p>
              <p className="text-2xl font-bold text-gray-900">{summary.total_enrolments || 0}</p>
              <p className="text-xs text-muted-foreground">Qualifications enrolled</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Average Score
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(summary.average_percentage)}
              </p>
              <p className="text-xs text-muted-foreground">Across all assessments</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Pass Rate
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.overall_pass_rate !== null
                  ? `${summary.overall_pass_rate.toFixed(1)}%`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Assessment pass rate</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Modules Completed
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.modules_completed || 0} / {summary.total_modules || 0}
              </p>
              <p className="text-xs text-muted-foreground">Module completion</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrolments List */}
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-gray-500" />
            Qualifications & Enrolments
          </CardTitle>
          <CardDescription>
            {enrolments.length} enrolment{enrolments.length !== 1 ? "s" : ""} across all qualifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrolments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enrolments recorded yet.</p>
          ) : (
            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Assessments</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolments.map((enrolment: any) => {
                    const assessmentsCount = enrolment.assessments?.length || 0;
                    const modulesCount = enrolment.moduleCompletions?.length || 0;
                    const completedModules =
                      enrolment.moduleCompletions?.filter((m: any) => m.status === "COMPLETED")
                        .length || 0;

                    return (
                      <TableRow key={enrolment.enrolment_id}>
                        <TableCell className="font-medium">
                          {enrolment.qualification?.name || enrolment.qualification_title || "—"}
                          {enrolment.qualification?.code && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({enrolment.qualification.code})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {enrolment.institution?.trading_name ||
                            enrolment.institution?.legal_name ||
                            "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              enrolment.enrolment_status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : enrolment.enrolment_status === "ACTIVE"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {enrolment.enrolment_status || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(enrolment.start_date)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {assessmentsCount} assessment{assessmentsCount !== 1 ? "s" : ""}
                        </TableCell>
                        <TableCell className="text-sm">
                          {completedModules} / {modulesCount} completed
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/qcto/enrolments/${enrolment.enrolment_id}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>
    </>
  );
}

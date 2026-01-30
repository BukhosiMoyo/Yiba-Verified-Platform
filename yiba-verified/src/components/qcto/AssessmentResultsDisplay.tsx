"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText, TrendingUp, CheckCircle, XCircle, Download, BarChart3 } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface AssessmentResult {
  result_id: string;
  module_name: string | null;
  marks_obtained: number | null;
  percentage: number | null;
  grade: string | null;
  passed: boolean | null;
  remarks: string | null;
  assessed_by: string | null;
  assessed_at: string | null;
  assessedByUser?: {
    user_id: string;
    full_name: string;
    email: string;
  };
}

interface Assessment {
  assessment_id: string;
  assessment_type: string;
  assessment_name: string;
  assessment_date: string;
  total_marks: number | null;
  passing_marks: number | null;
  results: AssessmentResult[];
}

interface AssessmentResultsDisplayProps {
  enrolmentId: string;
}

export function AssessmentResultsDisplay({ enrolmentId }: AssessmentResultsDisplayProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, [enrolmentId]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/qcto/enrolments/${enrolmentId}/assessments`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to fetch assessments" }));
        throw new Error(data.error || `Failed to fetch assessments: ${res.status}`);
      }
      const data = await res.json();
      setAssessments(data.assessments || []);
      setSummary(data.summary || {});
    } catch (e: any) {
      setError(e.message || "An error occurred");
      setAssessments([]);
      setSummary(null);
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

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "bg-gray-100 text-gray-800";
    const g = grade.toUpperCase();
    if (g === "A") return "bg-green-100 text-green-800";
    if (g === "B") return "bg-blue-100 text-blue-800";
    if (g === "C") return "bg-yellow-100 text-yellow-800";
    if (g === "D") return "bg-orange-100 text-orange-800";
    if (g === "F") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const getAssessmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      KNOWLEDGE: "Knowledge Test",
      PRACTICAL: "Practical Assessment",
      PORTFOLIO: "Portfolio",
      FINAL_EXAM: "Final Exam",
    };
    return labels[type] || type;
  };

  const exportToCSV = () => {
    if (assessments.length === 0) return;

    const headers = ["Assessment Name", "Type", "Date", "Module", "Marks", "Total Marks", "Percentage", "Grade", "Status", "Assessed By", "Assessed At"];
    const rows: string[][] = [headers];

    assessments.forEach((assessment) => {
      if (assessment.results.length === 0) {
        rows.push([
          assessment.assessment_name,
          getAssessmentTypeLabel(assessment.assessment_type),
          formatDate(assessment.assessment_date),
          "—",
          "—",
          assessment.total_marks?.toString() || "—",
          "—",
          "—",
          "—",
          "—",
          "—",
        ]);
      } else {
        assessment.results.forEach((result) => {
          rows.push([
            assessment.assessment_name,
            getAssessmentTypeLabel(assessment.assessment_type),
            formatDate(assessment.assessment_date),
            result.module_name || "Overall",
            result.marks_obtained?.toString() || "—",
            assessment.total_marks?.toString() || "—",
            result.percentage?.toFixed(1) || "—",
            result.grade || "—",
            result.passed === true ? "Passed" : result.passed === false ? "Failed" : "—",
            result.assessedByUser?.full_name || "—",
            result.assessed_at ? formatDate(result.assessed_at) : "—",
          ]);
        });
      }
    });

    const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `assessment-results-${enrolmentId}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate trend data for visualization
  const getTrendData = () => {
    if (assessments.length < 2) return null;

    const sortedAssessments = [...assessments].sort(
      (a, b) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime()
    );

    const trendPoints = sortedAssessments.map((assessment) => {
      const avgPercentage = assessment.results.length > 0
        ? assessment.results.reduce((sum, r) => sum + (r.percentage || 0), 0) / assessment.results.length
        : null;
      return {
        date: assessment.assessment_date,
        percentage: avgPercentage,
        name: assessment.assessment_name,
      };
    }).filter((p) => p.percentage !== null);

    return trendPoints.length >= 2 ? trendPoints : null;
  };

  const trendData = getTrendData();

  if (loading) {
    return (
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle>Assessment Results</CardTitle>
          <CardDescription>Loading assessment data...</CardDescription>
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
          <CardTitle>Assessment Results</CardTitle>
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

  return (
    <Card className="border border-gray-200/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              Assessment Results
            </CardTitle>
            <CardDescription>
              {summary?.total || 0} assessment{summary?.total !== 1 ? "s" : ""} recorded
              {summary?.average_percentage !== null && (
                <> · Average: {formatPercentage(summary.average_percentage)}</>
              )}
              {summary?.pass_rate !== null && (
                <> · Pass Rate: {summary.pass_rate.toFixed(1)}%</>
              )}
            </CardDescription>
          </div>
          {assessments.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {assessments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assessments recorded yet.</p>
        ) : (
          <div className="space-y-6">
            {/* Trend Visualization */}
            {trendData && trendData.length >= 2 && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Performance Trend</h4>
                </div>
                <div className="space-y-2">
                  {trendData.map((point, index) => {
                    const prevPoint = index > 0 ? trendData[index - 1] : null;
                    const trend = prevPoint && point.percentage !== null && prevPoint.percentage !== null
                      ? point.percentage > prevPoint.percentage
                        ? "up"
                        : point.percentage < prevPoint.percentage
                        ? "down"
                        : "stable"
                      : null;
                    
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700">{point.name}</span>
                          <span className="text-gray-600">{formatDate(point.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Progress
                              value={point.percentage || 0}
                              className="h-2"
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 w-12 text-right">
                            {formatPercentage(point.percentage)}
                          </span>
                          {trend && (
                            <span className={`text-xs ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"}`}>
                              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assessments grouped by type */}
            {(() => {
              const groupedByType: Record<string, Assessment[]> = {};
              assessments.forEach((assessment) => {
                if (!groupedByType[assessment.assessment_type]) {
                  groupedByType[assessment.assessment_type] = [];
                }
                groupedByType[assessment.assessment_type].push(assessment);
              });

              return Object.entries(groupedByType).map(([type, typeAssessments]) => (
                <div key={type} className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">
                      {getAssessmentTypeLabel(type)} ({typeAssessments.length})
                    </h3>
                  </div>
                  {typeAssessments.map((assessment) => (
                    <div key={assessment.assessment_id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{assessment.assessment_name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(assessment.assessment_date)}
                            </span>
                            {assessment.total_marks && (
                              <span className="text-xs text-muted-foreground">
                                (Total: {assessment.total_marks} marks
                                {assessment.passing_marks && `, Pass: ${assessment.passing_marks}`})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {assessment.results.length > 0 ? (
                        <ResponsiveTable>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Module</TableHead>
                                <TableHead>Marks</TableHead>
                                <TableHead>Percentage</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assessed By</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {assessment.results.map((result) => (
                                <TableRow key={result.result_id}>
                                  <TableCell className="font-medium">
                                    {result.module_name || "Overall"}
                                  </TableCell>
                                  <TableCell>
                                    {result.marks_obtained !== null
                                      ? `${result.marks_obtained}${assessment.total_marks ? ` / ${assessment.total_marks}` : ""}`
                                      : "—"}
                                  </TableCell>
                                  <TableCell>{formatPercentage(result.percentage)}</TableCell>
                                  <TableCell>
                                    {result.grade && (
                                      <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {result.passed === true && (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-sm">Passed</span>
                                      </div>
                                    )}
                                    {result.passed === false && (
                                      <div className="flex items-center gap-1 text-red-600">
                                        <XCircle className="h-4 w-4" />
                                        <span className="text-sm">Failed</span>
                                      </div>
                                    )}
                                    {result.passed === null && <span className="text-muted-foreground">—</span>}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {result.assessedByUser?.full_name || "—"}
                                    {result.assessed_at && (
                                      <div className="text-xs">{formatDate(result.assessed_at)}</div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ResponsiveTable>
                      ) : (
                        <p className="text-sm text-muted-foreground">No results recorded for this assessment.</p>
                      )}
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

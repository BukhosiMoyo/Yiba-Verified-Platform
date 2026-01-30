"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, CheckCircle, XCircle, Clock, Play, Download, PieChart } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { Button } from "@/components/ui/button";

interface ModuleCompletion {
  completion_id: string;
  module_name: string;
  module_code: string | null;
  module_type: string;
  completion_date: string | null;
  status: string;
  final_grade: string | null;
  marks_obtained: number | null;
  percentage: number | null;
  facilitator_id: string | null;
  notes: string | null;
  facilitator?: {
    facilitator_id: string;
    first_name: string;
    last_name: string;
  };
}

interface ModuleCompletionDisplayProps {
  enrolmentId: string;
}

export function ModuleCompletionDisplay({ enrolmentId }: ModuleCompletionDisplayProps) {
  const [modules, setModules] = useState<ModuleCompletion[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, [enrolmentId]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/qcto/enrolments/${enrolmentId}/module-completion`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to fetch module completion" }));
        throw new Error(data.error || `Failed to fetch module completion: ${res.status}`);
      }
      const data = await res.json();
      setModules(data.modules || []);
      setSummary(data.summary || {});
    } catch (e: any) {
      setError(e.message || "An error occurred");
      setModules([]);
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      COMPLETED: {
        label: "Completed",
        className: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      IN_PROGRESS: {
        label: "In Progress",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
        icon: <Play className="h-3 w-3" />,
      },
      NOT_STARTED: {
        label: "Not Started",
        className: "bg-muted text-muted-foreground",
        icon: <Clock className="h-3 w-3" />,
      },
      FAILED: {
        label: "Failed",
        className: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
        icon: <XCircle className="h-3 w-3" />,
      },
    };
    const config = statusConfig[status] || {
      label: status,
      className: "bg-muted text-muted-foreground",
      icon: null,
    };
    return (
      <Badge className={config.className}>
        <span className="flex items-center gap-1">
          {config.icon}
          {config.label}
        </span>
      </Badge>
    );
  };

  const getModuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      KNOWLEDGE: "Knowledge",
      PRACTICAL: "Practical",
      WBL: "Workplace-Based Learning",
    };
    return labels[type] || type;
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "bg-muted text-muted-foreground";
    const g = grade.toUpperCase();
    if (g === "A") return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300";
    if (g === "B") return "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300";
    if (g === "C") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300";
    if (g === "D") return "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300";
    if (g === "F") return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300";
    return "bg-muted text-muted-foreground";
  };

  const exportToCSV = () => {
    if (modules.length === 0) return;

    const headers = ["Module Name", "Module Code", "Type", "Status", "Final Grade", "Marks", "Percentage", "Completion Date", "Facilitator", "Notes"];
    const rows: string[][] = [headers];

    modules.forEach((module) => {
      rows.push([
        module.module_name,
        module.module_code || "—",
        getModuleTypeLabel(module.module_type),
        module.status,
        module.final_grade || "—",
        module.marks_obtained?.toString() || "—",
        module.percentage?.toFixed(1) || "—",
        formatDate(module.completion_date),
        module.facilitator ? `${module.facilitator.first_name} ${module.facilitator.last_name}` : "—",
        module.notes || "—",
      ]);
    });

    const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `module-completion-${enrolmentId}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle>Module Completion</CardTitle>
          <CardDescription>Loading module completion data...</CardDescription>
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
          <CardTitle>Module Completion</CardTitle>
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
              <BookOpen className="h-5 w-5 text-gray-500" />
              Module Completion
            </CardTitle>
            <CardDescription>
              {summary?.total || 0} module{summary?.total !== 1 ? "s" : ""} total
              {summary?.completion_rate !== null && (
                <> · {summary.completion_rate.toFixed(1)}% completion rate</>
              )}
            </CardDescription>
          </div>
          {modules.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {summary && (
          <div className="mb-6 space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">
                  {summary.completed || 0} / {summary.total || 0} completed
                </span>
              </div>
              <Progress
                value={summary.completion_rate || 0}
                className="h-3"
              />
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-900">Completed</span>
                </div>
                <p className="text-lg font-bold text-green-900">{summary.completed || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Play className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-900">In Progress</span>
                </div>
                <p className="text-lg font-bold text-blue-900">{summary.in_progress || 0}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-900">Not Started</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{summary.not_started || 0}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-900">Failed</span>
                </div>
                <p className="text-lg font-bold text-red-900">{summary.failed || 0}</p>
              </div>
            </div>

            {/* Module Type Breakdown */}
            {(() => {
              const typeBreakdown: Record<string, { total: number; completed: number }> = {};
              modules.forEach((module) => {
                if (!typeBreakdown[module.module_type]) {
                  typeBreakdown[module.module_type] = { total: 0, completed: 0 };
                }
                typeBreakdown[module.module_type].total++;
                if (module.status === "COMPLETED") {
                  typeBreakdown[module.module_type].completed++;
                }
              });

              if (Object.keys(typeBreakdown).length > 0) {
                return (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <PieChart className="h-4 w-4 text-gray-600" />
                      <h4 className="text-sm font-semibold text-gray-900">Completion by Module Type</h4>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(typeBreakdown).map(([type, stats]) => {
                        const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-700">{getModuleTypeLabel(type)}</span>
                              <span className="text-gray-600">
                                {stats.completed} / {stats.total} ({rate.toFixed(0)}%)
                              </span>
                            </div>
                            <Progress value={rate} className="h-1.5" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No modules recorded yet.</p>
        ) : (
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Facilitator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.completion_id}>
                    <TableCell className="font-medium">
                      {module.module_name}
                      {module.module_code && (
                        <span className="text-xs text-muted-foreground ml-1">({module.module_code})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getModuleTypeLabel(module.module_type)}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(module.status)}</TableCell>
                    <TableCell>
                      {module.final_grade && (
                        <Badge className={getGradeColor(module.final_grade)}>{module.final_grade}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatPercentage(module.percentage)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(module.completion_date)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {module.facilitator
                        ? `${module.facilitator.first_name} ${module.facilitator.last_name}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ResponsiveTable>
        )}
      </CardContent>
    </Card>
  );
}

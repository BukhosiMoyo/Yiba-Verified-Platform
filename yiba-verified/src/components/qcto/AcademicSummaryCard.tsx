"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Award, BookOpen, CheckCircle, BarChart3, Target } from "lucide-react";

interface AcademicSummaryCardProps {
  enrolmentId: string;
}

interface SummaryData {
  assessments: {
    total: number;
    average_percentage: number | null;
    pass_rate: number | null;
    total_passed: number;
    total_failed: number;
  };
  modules: {
    total: number;
    completed: number;
    in_progress: number;
    not_started: number;
    failed: number;
    completion_rate: number | null;
  };
}

export function AcademicSummaryCard({ enrolmentId }: AcademicSummaryCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [enrolmentId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both assessments and module completion data
      const [assessmentsRes, modulesRes] = await Promise.all([
        fetch(`/api/qcto/enrolments/${enrolmentId}/assessments`),
        fetch(`/api/qcto/enrolments/${enrolmentId}/module-completion`),
      ]);

      if (!assessmentsRes.ok) {
        const errorData = await assessmentsRes.json().catch(() => ({ error: "Failed to fetch assessments" }));
        throw new Error(errorData.error || `Failed to fetch assessments: ${assessmentsRes.status}`);
      }

      if (!modulesRes.ok) {
        const errorData = await modulesRes.json().catch(() => ({ error: "Failed to fetch module completion" }));
        throw new Error(errorData.error || `Failed to fetch module completion: ${modulesRes.status}`);
      }

      const [assessmentsData, modulesData] = await Promise.all([
        assessmentsRes.json(),
        modulesRes.json(),
      ]);

      setSummary({
        assessments: {
          total: assessmentsData.summary?.total || 0,
          average_percentage: assessmentsData.summary?.average_percentage || null,
          pass_rate: assessmentsData.summary?.pass_rate || null,
          total_passed: assessmentsData.summary?.total_passed || 0,
          total_failed: assessmentsData.summary?.total_failed || 0,
        },
        modules: {
          total: modulesData.summary?.total || 0,
          completed: modulesData.summary?.completed || 0,
          in_progress: modulesData.summary?.in_progress || 0,
          not_started: modulesData.summary?.not_started || 0,
          failed: modulesData.summary?.failed || 0,
          completion_rate: modulesData.summary?.completion_rate || null,
        },
      });
    } catch (e: any) {
      setError(e.message || "An error occurred");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return "—";
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card className="border border-gray-200/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-gray-500" />
            Academic Summary
          </CardTitle>
          <CardDescription>Loading academic summary...</CardDescription>
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
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-gray-500" />
            Academic Summary
          </CardTitle>
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

  const assessments = summary?.assessments || {
    total: 0,
    average_percentage: null,
    pass_rate: null,
    total_passed: 0,
    total_failed: 0,
  };

  const modules = summary?.modules || {
    total: 0,
    completed: 0,
    in_progress: 0,
    not_started: 0,
    failed: 0,
    completion_rate: null,
  };

  // Calculate overall performance score (weighted average)
  const overallScore = (() => {
    if (assessments.average_percentage === null && modules.completion_rate === null) return null;
    if (assessments.average_percentage === null) return modules.completion_rate;
    if (modules.completion_rate === null) return assessments.average_percentage;
    // Weight: 60% assessments, 40% module completion
    return (assessments.average_percentage * 0.6) + (modules.completion_rate * 0.4);
  })();

  // Determine certification eligibility
  const isEligible = (() => {
    if (assessments.pass_rate === null || modules.completion_rate === null) return null;
    return assessments.pass_rate >= 70 && modules.completion_rate >= 80;
  })();

  return (
    <Card className="border border-gray-200/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-gray-500" />
          Academic Summary
        </CardTitle>
        <CardDescription>Overall performance and completion status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
                  Average Score
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {formatPercentage(assessments.average_percentage)}
              </p>
              <p className="text-xs text-blue-700">Across all assessments</p>
            </div>

            <div className="space-y-1 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-xs font-semibold uppercase tracking-wide text-green-900">
                  Pass Rate
                </p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formatPercentage(assessments.pass_rate)}
              </p>
              <p className="text-xs text-green-700">
                {assessments.total_passed} passed, {assessments.total_failed} failed
              </p>
            </div>

            <div className="space-y-1 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-purple-600" />
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-900">
                  Modules Completed
                </p>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {modules.completed} / {modules.total}
              </p>
              <p className="text-xs text-purple-700">
                {formatPercentage(modules.completion_rate)} completion rate
              </p>
            </div>

            <div className="space-y-1 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-orange-600" />
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">
                  Overall Performance
                </p>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {formatPercentage(overallScore)}
              </p>
              <p className="text-xs text-orange-700">Weighted average</p>
            </div>
          </div>

          {/* Overall Progress */}
          {overallScore !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Overall Academic Performance</span>
                <span className="font-semibold text-gray-900">{formatPercentage(overallScore)}</span>
              </div>
              <Progress
                value={overallScore}
                className="h-3"
              />
            </div>
          )}

          {/* Certification Eligibility */}
          {isEligible !== null && (
            <div className={`p-4 rounded-lg border ${
              isEligible
                ? "bg-green-50 border-green-200"
                : "bg-yellow-50 border-yellow-200"
            }`}>
              <div className="flex items-center gap-2">
                {isEligible ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">Certification Eligible</p>
                      <p className="text-xs text-green-700">
                        Meets requirements: Pass rate ≥70% and Module completion ≥80%
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">Certification Pending</p>
                      <p className="text-xs text-yellow-700">
                        Requirements not yet met: Pass rate {formatPercentage(assessments.pass_rate)} (need ≥70%) or Module completion {formatPercentage(modules.completion_rate)} (need ≥80%)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Assessment & Module Breakdown */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Assessment Performance
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Assessments:</span>
                  <span className="font-medium">{assessments.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Score:</span>
                  <span className="font-medium">{formatPercentage(assessments.average_percentage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pass Rate:</span>
                  <span className="font-medium">{formatPercentage(assessments.pass_rate)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Module Progress
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Modules:</span>
                  <span className="font-medium">{modules.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">{modules.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">In Progress:</span>
                  <span className="font-medium text-blue-600">{modules.in_progress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion Rate:</span>
                  <span className="font-medium">{formatPercentage(modules.completion_rate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

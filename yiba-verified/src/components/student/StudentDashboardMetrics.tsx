"use client";

import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { GraduationCap, ClipboardCheck, Award, TrendingUp } from "lucide-react";

interface StudentDashboardMetricsProps {
  metrics?: {
    activeEnrolments: number;
    attendance: number | null;
    certificates: number;
    progress: number | null;
  };
}

export function StudentDashboardMetrics({ metrics }: StudentDashboardMetricsProps) {
  // Default values for safety
  const defaultMetrics = {
    activeEnrolments: 0,
    attendance: null,
    certificates: 0,
    progress: null,
  };
  
  const safeMetrics = metrics || defaultMetrics;
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <DashboardMetricCard
        title="Active Enrolments"
        value={safeMetrics.activeEnrolments}
        subtext="Currently enrolled"
        colorVariant="blue"
        trendTint="blue"
        icon={GraduationCap}
        trendPlaceholder="—"
      />
      <DashboardMetricCard
        title="Attendance"
        value={safeMetrics.attendance !== null ? `${safeMetrics.attendance}%` : "—"}
        subtext="This term"
        colorVariant="green"
        trendTint="green"
        icon={ClipboardCheck}
        trendPlaceholder="—"
      />
      <DashboardMetricCard
        title="Certificates"
        value={safeMetrics.certificates}
        subtext="Completed"
        colorVariant="purple"
        trendTint="blue"
        icon={Award}
        trendPlaceholder="—"
      />
      <DashboardMetricCard
        title="Progress"
        value={safeMetrics.progress !== null ? `${safeMetrics.progress}%` : "—"}
        subtext="Current qualification"
        colorVariant="amber"
        trendTint="amber"
        icon={TrendingUp}
        trendPlaceholder="—"
      />
    </div>
  );
}

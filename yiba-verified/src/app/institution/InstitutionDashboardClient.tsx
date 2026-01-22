"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { GraduationCap, FileCheck, FileText, AlertCircle, Hand } from "lucide-react";

interface InstitutionDashboardClientProps {
  greeting: string;
  userName: string;
  todayDate: string;
}

export function InstitutionDashboardClient({
  greeting,
  userName,
  todayDate,
}: InstitutionDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Greeting section */}
      <div className="rounded-2xl border border-gray-200/60 bg-white px-6 py-5 shadow-sm">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            {greeting}, {userName}{" "}
            <Hand className="inline-block h-5 w-5 text-gray-500 ml-1 align-middle" aria-hidden />
          </h1>
          <p className="text-sm text-gray-500">
            Today is {todayDate}
          </p>
          <p className="text-sm text-gray-500">
            Overview of your institution's compliance and learner management
          </p>
        </div>
      </div>

      {/* Metric cards – no outer wrapper, each card stands alone */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardMetricCard
          title="Active Learners"
          value="342"
          subtext="+8 this month"
          colorVariant="blue"
          trendTint="blue"
          icon={GraduationCap}
          trendPlaceholder="—"
        />
        <DashboardMetricCard
          title="Readiness Status"
          value="3/5"
          subtext="Submitted for review"
          colorVariant="green"
          trendTint="green"
          icon={FileCheck}
          trendPlaceholder="—"
        />
        <DashboardMetricCard
          title="Evidence Documents"
          value="127"
          subtext="Total uploaded"
          colorVariant="purple"
          trendTint="blue"
          icon={FileText}
          trendPlaceholder="—"
        />
        <DashboardMetricCard
          title="Flagged Items"
          value="2"
          subtext="Requires attention"
          colorVariant="amber"
          trendTint="amber"
          icon={AlertCircle}
          trendPlaceholder="—"
        />
      </div>

      {/* Recent Learners Table */}
      <Card className="overflow-hidden border border-gray-200/60 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <CardHeader className="bg-gradient-to-b from-gray-50/40 to-transparent pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Learners</CardTitle>
            <CardDescription>Recently added or updated learners</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table className="border-collapse [&_th]:border [&_th]:border-gray-200 [&_td]:border [&_td]:border-gray-200">
              <TableHeader>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className="bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Name</TableHead>
                  <TableHead className="bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600">National ID</TableHead>
                  <TableHead className="bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Qualification</TableHead>
                  <TableHead className="bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Status</TableHead>
                  <TableHead className="bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600">Enrolled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="group hover:bg-sky-50/50 transition-colors">
                  <TableCell className="font-medium text-gray-900 py-3.5">Thabo Mokoena</TableCell>
                  <TableCell className="text-gray-600 font-mono text-[13px] py-3.5">9001015009087</TableCell>
                  <TableCell className="text-gray-700 py-3.5">Project Manager</TableCell>
                  <TableCell className="py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>
                  </TableCell>
                  <TableCell className="text-gray-600 py-3.5">2025-01-10</TableCell>
                </TableRow>
                <TableRow className="group hover:bg-sky-50/50 transition-colors">
                  <TableCell className="font-medium text-gray-900 py-3.5">Nomsa Dlamini</TableCell>
                  <TableCell className="text-gray-600 font-mono text-[13px] py-3.5">9205056001088</TableCell>
                  <TableCell className="text-gray-700 py-3.5">Plumber</TableCell>
                  <TableCell className="py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>
                  </TableCell>
                  <TableCell className="text-gray-600 py-3.5">2025-01-08</TableCell>
                </TableRow>
                <TableRow className="group hover:bg-sky-50/50 transition-colors">
                  <TableCell className="font-medium text-gray-900 py-3.5">John Doe</TableCell>
                  <TableCell className="text-gray-600 font-mono text-[13px] py-3.5">8802024007076</TableCell>
                  <TableCell className="text-gray-700 py-3.5">Electrician</TableCell>
                  <TableCell className="py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Completed</span>
                  </TableCell>
                  <TableCell className="text-gray-600 py-3.5">2024-12-15</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100/80 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
          <CardDescription>Latest changes and updates</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            <div className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50/60">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <FileCheck className="h-4 w-4 text-blue-600" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">Readiness submitted</span>
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">Readiness</span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">Project Manager qualification</p>
                <p className="mt-1 text-xs text-gray-400">3 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50/60">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <FileText className="h-4 w-4 text-emerald-600" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">Evidence uploaded</span>
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">Evidence</span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">Facilitator CV</p>
                <p className="mt-1 text-xs text-gray-400">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50/60">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <GraduationCap className="h-4 w-4 text-amber-600" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">Learner created</span>
                  <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">Learner</span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">Thabo Mokoena</p>
                <p className="mt-1 text-xs text-gray-400">2 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

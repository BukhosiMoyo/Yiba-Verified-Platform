"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveTable } from "@/components/shared/ResponsiveTable";
import { DashboardModeToggle } from "@/components/dashboard/DashboardModeToggle";
import { useDashboardMode } from "@/hooks/useDashboardMode";
import { BarChart3, TrendingUp, PieChart } from "lucide-react";

export default function InstitutionDashboard() {
  const { mode, setMode } = useDashboardMode();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Institution Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your institution's compliance and learner management
          </p>
        </div>
        <div className="flex-shrink-0">
          <DashboardModeToggle mode={mode} onChange={setMode} />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">+8 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Readiness Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3/5</div>
            <p className="text-xs text-muted-foreground">Submitted for review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evidence Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">Total uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Learners Table */}
      <div className="space-y-2">
        <div>
          <h2 className="text-lg font-semibold">Recent Learners</h2>
          <p className="text-sm text-muted-foreground">Recently added or updated learners</p>
        </div>
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>National ID</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrolled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Thabo Mokoena</TableCell>
                <TableCell>9001015009087</TableCell>
                <TableCell>Project Manager</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>2025-01-10</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Nomsa Dlamini</TableCell>
                <TableCell>9205056001088</TableCell>
                <TableCell>Plumber</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>2025-01-08</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>John Doe</TableCell>
                <TableCell>8802024007076</TableCell>
                <TableCell>Electrician</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>2024-12-15</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ResponsiveTable>
      </div>

      {/* Activity Feed Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest changes and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Readiness submitted</span> - Project Manager qualification
                </p>
                <p className="text-xs text-muted-foreground mt-1">3 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Evidence uploaded</span> - Facilitator CV
                </p>
                <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Learner created</span> - Thabo Mokoena
                </p>
                <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics Section - Only visible in Advanced mode */}
      {mode === "advanced" && (
        <div className="space-y-6 transition-all duration-200 opacity-100 translate-y-0">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <CardTitle>Analytics (Coming Soon)</CardTitle>
              </div>
              <CardDescription>
                Advanced analytics and trend insights will be available here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-gray-200/60 bg-gray-50/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Growth Trends</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Analytics coming soon</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200/60 bg-gray-50/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Performance Metrics</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Analytics coming soon</p>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200/60 bg-gray-50/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Comparative Analysis</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Analytics coming soon</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

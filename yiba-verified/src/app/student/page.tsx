"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardModeToggle } from "@/components/dashboard/DashboardModeToggle";
import { useDashboardMode } from "@/hooks/useDashboardMode";

export default function StudentDashboard() {
  const { mode, setMode } = useDashboardMode();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Your learning progress and enrolment information
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
            <CardTitle className="text-sm font-medium">Active Enrolments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">This term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">Current qualification</p>
          </CardContent>
        </Card>
      </div>

      {/* My Enrolments Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Enrolments</CardTitle>
          <CardDescription>Your current and past enrolments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Qualification</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Project Manager</TableCell>
                <TableCell>Ubuntu Skills Development</TableCell>
                <TableCell>2025-02-01</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>68%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Plumber</TableCell>
                <TableCell>Imbokodo Technical Training</TableCell>
                <TableCell>2024-01-15</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Activity Feed Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
          <CardDescription>Latest information about your enrolments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Attendance updated</span> - Project Manager course
                </p>
                <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Certificate issued</span> - Plumber qualification
                </p>
                <p className="text-xs text-muted-foreground mt-1">2 weeks ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">Enrolled</span> - Project Manager at Ubuntu Skills Development
                </p>
                <p className="text-xs text-muted-foreground mt-1">1 month ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Mode for Students - Limited insights placeholder */}
      {mode === "advanced" && (
        <div className="space-y-6 transition-all duration-200 opacity-100 translate-y-0">
          <Card>
            <CardHeader>
              <CardTitle>Insights (Coming Soon)</CardTitle>
              <CardDescription>
                Additional learning insights and analytics will be available here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Enhanced analytics features are coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText, Download, BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate and view platform reports and analytics
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              Institution Reports
            </CardTitle>
            <CardDescription>
              Generate reports for institution activity and compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              <Download className="h-4 w-4 mr-2" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-500" />
              Analytics Dashboard
            </CardTitle>
            <CardDescription>
              View platform-wide analytics and metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              <Download className="h-4 w-4 mr-2" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              Compliance Reports
            </CardTitle>
            <CardDescription>
              Export compliance and audit reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              <Download className="h-4 w-4 mr-2" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-12">
          <EmptyState
            title="Reports feature coming soon"
            description="We're working on comprehensive reporting capabilities. Check back soon!"
            icon={<BarChart3 className="h-12 w-12 text-gray-400" />}
          />
        </CardContent>
      </Card>
    </div>
  );
}

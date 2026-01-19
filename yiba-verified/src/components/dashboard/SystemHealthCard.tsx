"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, AlertCircle } from "lucide-react";

interface SystemHealthCardProps {
  className?: string;
}

/**
 * SystemHealthCard Component
 * 
 * Compact system health panel for Advanced mode
 */
export function SystemHealthCard({ className }: SystemHealthCardProps) {
  return (
    <Card className={`border border-gray-200/60 bg-white rounded-xl ${className || ""}`}>
      <CardHeader className="px-5 pt-5 pb-3 border-b border-gray-100/60">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" strokeWidth={1.5} />
          <CardTitle className="text-base font-semibold text-gray-900">System Health</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-4 space-y-3">
        {/* API Uptime */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">API Uptime</span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={2} />
            <span className="text-sm font-medium text-gray-900">99.9%</span>
          </div>
        </div>

        {/* Background Jobs */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Background Jobs</span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={2} />
            <span className="text-sm font-medium text-gray-900">Running</span>
          </div>
        </div>

        {/* Email Health */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Email Health</span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={2} />
            <span className="text-sm font-medium text-gray-900">Healthy</span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100/60">
          <span className="text-xs text-gray-500 italic">Placeholder - coming soon</span>
        </div>
      </CardContent>
    </Card>
  );
}

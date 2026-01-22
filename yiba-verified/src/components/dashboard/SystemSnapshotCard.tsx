"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2 } from "lucide-react";

interface SystemSnapshotCardProps {
  className?: string;
}

/**
 * SystemSnapshotCard Component
 * 
 * Compact system status snapshot for Lite mode
 */
export function SystemSnapshotCard({ className }: SystemSnapshotCardProps) {
  return (
    <Card className={`group relative flex flex-col h-full border border-gray-200/80 rounded-xl transition-all duration-200 hover:border-gray-300 overflow-hidden bg-gradient-to-br from-emerald-50/60 via-white to-white ${className || ""}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pt-5 pb-3 flex-shrink-0">
        <CardTitle className="text-sm font-medium text-gray-600 min-w-0 flex-1 pr-2">
          <span className="truncate block">System Snapshot</span>
        </CardTitle>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 transition-colors duration-200 group-hover:bg-emerald-100">
          <Activity className="h-5 w-5 text-emerald-600" strokeWidth={1.5} />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0 flex flex-col justify-between flex-1 min-h-0 space-y-4">
        {/* System Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={2} />
            <span className="text-sm font-medium text-gray-900">System Status</span>
          </div>
          <div className="flex items-center gap-2 ml-6">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-600">Operational</span>
          </div>
        </div>

        {/* Avg Review Turnaround */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-gray-600 block">Avg Review Turnaround</span>
          <span className="text-lg font-semibold text-gray-900">2.3 days</span>
          <span className="text-xs text-gray-500">Coming soon</span>
        </div>

        {/* Alerts */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100/60">
          <span className="text-xs font-medium text-gray-600 block">Alerts</span>
          <span className="text-xs text-gray-500">No active alerts</span>
        </div>
      </CardContent>
    </Card>
  );
}

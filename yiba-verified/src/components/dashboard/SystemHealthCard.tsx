"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface SystemHealthCardProps {
  className?: string;
  databaseStatus?: "healthy" | "degraded" | "down";
  recentErrors?: number;
  lastChecked?: string;
}

/**
 * SystemHealthCard Component
 * 
 * Compact system health panel for Advanced mode
 */
export function SystemHealthCard({ 
  className, 
  databaseStatus = "healthy",
  recentErrors = 0,
  lastChecked
}: SystemHealthCardProps) {
  const getStatusIcon = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={2} />;
      case "degraded":
        return <AlertCircle className="h-4 w-4 text-amber-600" strokeWidth={2} />;
      case "down":
        return <AlertCircle className="h-4 w-4 text-red-600" strokeWidth={2} />;
    }
  };

  const getStatusText = (status: "healthy" | "degraded" | "down") => {
    switch (status) {
      case "healthy":
        return "Healthy";
      case "degraded":
        return "Degraded";
      case "down":
        return "Down";
    }
  };

  const getErrorStatus = (errors: number) => {
    if (errors === 0) {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={2} />,
        text: "No errors",
      };
    } else if (errors < 5) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-amber-600" strokeWidth={2} />,
        text: `${errors} error${errors !== 1 ? "s" : ""}`,
      };
    } else {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-600" strokeWidth={2} />,
        text: `${errors} errors`,
      };
    }
  };

  const errorStatus = getErrorStatus(recentErrors);

  return (
    <Card className={`border border-gray-200/60 bg-white rounded-xl ${className || ""}`}>
      <CardHeader className="px-5 pt-5 pb-3 border-b border-gray-100/60">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" strokeWidth={1.5} />
          <CardTitle className="text-base font-semibold text-gray-900">System Health</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-4 space-y-3">
        {/* Database Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Database</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(databaseStatus)}
            <span className="text-sm font-medium text-gray-900">{getStatusText(databaseStatus)}</span>
          </div>
        </div>

        {/* Recent Errors */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Recent Errors (24h)</span>
          <div className="flex items-center gap-2">
            {errorStatus.icon}
            <span className="text-sm font-medium text-gray-900">{errorStatus.text}</span>
          </div>
        </div>

        {/* System Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">System Status</span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={2} />
            <span className="text-sm font-medium text-gray-900">Operational</span>
          </div>
        </div>

        {lastChecked && (
          <div className="pt-2 border-t border-gray-100/60">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Checked {new Date(lastChecked).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

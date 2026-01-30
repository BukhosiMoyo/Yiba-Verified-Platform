"use client";

import { useState, useEffect } from "react";
import { AccountPage, AccountSection } from "@/components/account/AccountPage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Monitor, Smartphone, Tablet, Globe, CheckCircle2, XCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

type ActivityLog = {
  id: string;
  activity_type: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: string | null;
  location: string | null;
  success: boolean;
  created_at: string;
};

function getActivityIcon(activityType: string) {
  switch (activityType) {
    case "LOGIN":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "LOGOUT":
      return <XCircle className="h-4 w-4 text-gray-600" />;
    default:
      return <Monitor className="h-4 w-4 text-blue-600" />;
  }
}

function getDeviceIcon(deviceInfo: string | null) {
  if (!deviceInfo) return <Monitor className="h-4 w-4" />;
  const info = deviceInfo.toLowerCase();
  if (info.includes("mobile")) return <Smartphone className="h-4 w-4" />;
  if (info.includes("tablet")) return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

function formatActivityType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/account/activity?limit=100");
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch activity logs (${response.status})`);
        }
        
        const data = await response.json();
        
        // Handle both response formats
        if (data.items) {
          setLogs(data.items || []);
        } else if (Array.isArray(data)) {
          setLogs(data);
        } else if (data.logs) {
          setLogs(data.logs || []);
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.error("Error fetching activity logs:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load activity logs";
        setError(errorMessage);
        // Still set logs to empty array so UI doesn't break
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  return (
    <AccountPage
      title="Activity Logs"
      subtitle="View your account activity and access history"
    >
      <AccountSection
        title="Recent Activity"
        description="Your recent account activity and access logs including device information and IP addresses"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No activity logs"
            description="Your account activity will appear here once you start using the system."
          />
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="min-w-[180px] whitespace-nowrap font-semibold">Time</TableHead>
                    <TableHead className="min-w-[120px] whitespace-nowrap font-semibold">Activity</TableHead>
                    <TableHead className="min-w-[250px] whitespace-nowrap font-semibold">Device</TableHead>
                    <TableHead className="min-w-[140px] whitespace-nowrap font-semibold">IP Address</TableHead>
                    <TableHead className="min-w-[150px] whitespace-nowrap font-semibold">Location</TableHead>
                    <TableHead className="min-w-[100px] whitespace-nowrap font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                            {getActivityIcon(log.activity_type)}
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">
                            {formatActivityType(log.activity_type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                            {getDeviceIcon(log.device_info)}
                          </div>
                          <span className="text-sm text-foreground">
                            {log.device_info || "Unknown Device"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground/60" />
                          {log.ip_address || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {log.location || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.success ? "default" : "destructive"}
                          className="text-xs whitespace-nowrap"
                        >
                          {log.success ? "Success" : "Failed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </AccountSection>
    </AccountPage>
  );
}

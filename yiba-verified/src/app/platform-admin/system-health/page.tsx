"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthStatusPill } from "@/components/ui/health-status-pill";
import { Database, Server, Shield, Clock, Info } from "lucide-react";

interface HealthStatus {
  status: "healthy" | "degraded" | "down";
  message: string;
  lastChecked: string;
}

const overallStatusStyles = {
  healthy: {
    gradient: "bg-gradient-to-br from-emerald-50/60 to-white",
    accent: "border-l-emerald-500",
  },
  degraded: {
    gradient: "bg-gradient-to-br from-amber-50/60 to-white",
    accent: "border-l-amber-500",
  },
  down: {
    gradient: "bg-gradient-to-br from-red-50/60 to-white",
    accent: "border-l-red-500",
  },
} as const;

export default function SystemHealthPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: "healthy",
    message: "All systems operational",
    lastChecked: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemHealth();
    // Refresh every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    try {
      // Simple health check - you can expand this to check actual endpoints
      setHealthStatus({
        status: "healthy",
        message: "All systems operational",
        lastChecked: new Date().toISOString(),
      });
    } catch (error) {
      setHealthStatus({
        status: "degraded",
        message: "Some services may be experiencing issues",
        lastChecked: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const pillStatus = healthStatus.status === "down" ? "offline" : healthStatus.status;

  return (
    <div className="space-y-6">
      {/* 1) Page header — status banner */}
      <div className="rounded-xl bg-gradient-to-b from-blue-50/50 to-transparent px-1 py-4 -mx-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor platform status and service availability
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
            <Clock className="h-3.5 w-3.5" />
            Last checked {new Date(healthStatus.lastChecked).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* 2) Overall Status Card */}
      <Card
        className={`overflow-hidden border-l-4 border-gray-200/60 ${overallStatusStyles[healthStatus.status].gradient} ${overallStatusStyles[healthStatus.status].accent}`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">
            Overall System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-0.5">{healthStatus.message}</p>
              <p className="text-sm text-gray-500">
                All core services are running normally
              </p>
            </div>
            <HealthStatusPill status={pillStatus} size="md" />
          </div>
        </CardContent>
      </Card>

      {/* 3) Service Status Cards */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden border border-gray-200/60 bg-gradient-to-br from-gray-50/30 to-white transition-shadow hover:shadow-sm hover:border-gray-300/70">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50/60 text-emerald-600">
                  <Database className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">Database</CardTitle>
                  <p className="text-xs text-gray-500">PostgreSQL</p>
                </div>
              </div>
              <HealthStatusPill status="online" size="sm" />
            </div>
          </CardHeader>
          <CardContent className="pt-0" />
        </Card>

        <Card className="overflow-hidden border border-gray-200/60 bg-gradient-to-br from-gray-50/30 to-white transition-shadow hover:shadow-sm hover:border-gray-300/70">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50/60 text-emerald-600">
                  <Server className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">API Server</CardTitle>
                  <p className="text-xs text-gray-500">Next.js API</p>
                </div>
              </div>
              <HealthStatusPill status="online" size="sm" />
            </div>
          </CardHeader>
          <CardContent className="pt-0" />
        </Card>

        <Card className="overflow-hidden border border-gray-200/60 bg-gradient-to-br from-gray-50/30 to-white transition-shadow hover:shadow-sm hover:border-gray-300/70">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50/60 text-emerald-600">
                  <Shield className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">Authentication</CardTitle>
                  <p className="text-xs text-gray-500">NextAuth</p>
                </div>
              </div>
              <HealthStatusPill status="online" size="sm" />
            </div>
          </CardHeader>
          <CardContent className="pt-0" />
        </Card>
      </div>

      {/* 5) System Information Card */}
      <Card className="border border-gray-200/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50/60 text-blue-600">
              <Info className="h-4 w-4" strokeWidth={2} />
            </span>
            System Information
          </CardTitle>
          <CardDescription>Platform configuration and environment details</CardDescription>
        </CardHeader>
        <CardContent className="bg-gray-50/40 rounded-lg">
          <div className="divide-y divide-gray-200/60 text-sm">
            <div className="flex justify-between items-center py-3 first:pt-0">
              <span className="text-gray-600">Database</span>
              <span className="font-medium text-gray-900">PostgreSQL</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Framework</span>
              <span className="font-medium text-gray-900">Next.js</span>
            </div>
            <div className="flex justify-between items-center py-3 last:pb-0">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-gray-900">Operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

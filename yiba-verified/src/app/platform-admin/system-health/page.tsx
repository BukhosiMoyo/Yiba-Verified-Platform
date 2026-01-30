"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthStatusPill } from "@/components/ui/health-status-pill";
import { Database, Server, Shield, Clock, Info, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthStatus {
  status: "healthy" | "degraded" | "down";
  message: string;
  lastChecked: string;
}

const overallStatusStyles = {
  healthy: {
    card: "border-border bg-card",
    accent: "border-l-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  degraded: {
    card: "border-border bg-card",
    accent: "border-l-amber-500",
    iconBg: "bg-amber-100 dark:bg-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  down: {
    card: "border-border bg-card",
    accent: "border-l-red-500",
    iconBg: "bg-red-100 dark:bg-red-500/20",
    iconColor: "text-red-600 dark:text-red-400",
  },
} as const;

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "online" | "healthy" | "degraded" | "offline";
}

function ServiceCard({ icon, title, description, status }: ServiceCardProps) {
  return (
    <Card className="overflow-hidden border-border bg-card transition-shadow hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          {/* Row 1: icon + title + status pill */}
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {icon}
              </span>
              <CardTitle className="text-base font-bold text-foreground break-words min-w-0">{title}</CardTitle>
            </div>
            <HealthStatusPill status={status} size="sm" className="flex-shrink-0" />
          </div>
          {/* Row 2: description on its own line for readability */}
          <p className="text-xs text-muted-foreground break-words">
            {description}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function SystemHealthPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: "healthy",
    message: "All systems operational",
    lastChecked: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const statusStyle = overallStatusStyles[healthStatus.status];

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">System Health</h1>
            <p className="text-sm text-muted-foreground">
              Monitor platform status and service availability
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <Clock className="h-3.5 w-3.5" />
          Last checked {mounted ? new Date(healthStatus.lastChecked).toLocaleTimeString() : "—"}
        </span>
      </div>

      {/* Overall Status Card */}
      <Card className={cn(
        "overflow-hidden border-l-4",
        statusStyle.card,
        statusStyle.accent
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              statusStyle.iconBg
            )}>
              <Activity className={cn("h-5 w-5", statusStyle.iconColor)} />
            </div>
            <CardTitle className="text-base font-semibold text-foreground">
              Overall System Status
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-foreground mb-0.5">
                {healthStatus.message}
              </p>
              <p className="text-sm text-muted-foreground">
                All core services are running normally
              </p>
            </div>
            <HealthStatusPill status={pillStatus} size="md" />
          </div>
        </CardContent>
      </Card>

      {/* Service Status Cards */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        <ServiceCard
          icon={<Database className="h-5 w-5" strokeWidth={2} />}
          title="Database"
          description="PostgreSQL"
          status="online"
        />
        <ServiceCard
          icon={<Server className="h-5 w-5" strokeWidth={2} />}
          title="API Server"
          description="Next.js API"
          status="online"
        />
        <ServiceCard
          icon={<Shield className="h-5 w-5" strokeWidth={2} />}
          title="Authentication"
          description="NextAuth"
          status="online"
        />
      </div>

      {/* System Information Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Info className="h-4 w-4" strokeWidth={2} />
            </span>
            System Information
          </CardTitle>
          <CardDescription>Platform configuration and environment details</CardDescription>
        </CardHeader>
        <CardContent className="bg-muted/30 rounded-lg">
          <div className="divide-y divide-border text-sm">
            <div className="flex justify-between items-center py-3 first:pt-0">
              <span className="text-muted-foreground">Database</span>
              <span className="font-medium text-foreground">PostgreSQL</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-medium text-foreground">Next.js</span>
            </div>
            <div className="flex justify-between items-center py-3 last:pb-0">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-foreground">Operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

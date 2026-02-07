"use client";

import { useEffect, useState } from "react";
import { MetricsCards } from "./_components/MetricsCards";
import { TrendChart } from "./_components/TrendChart";
import { AlertsPanel } from "./_components/AlertsPanel";
import { QuickActions } from "./_components/QuickActions";
import { awarenessApi } from "@/lib/outreach/api";
import { OutreachMetrics, TrendDataPoint, Alert } from "@/lib/outreach/types";
import { Loader2 } from "lucide-react";

export default function OutreachDashboardPage() {
    const [metrics, setMetrics] = useState<OutreachMetrics | null>(null);
    const [trends, setTrends] = useState<TrendDataPoint[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [metricsData, trendsData, alertsData] = await Promise.all([
                    awarenessApi.getMetrics(),
                    awarenessApi.getTrends(),
                    awarenessApi.getAlerts(),
                ]);
                setMetrics(metricsData);
                setTrends(trendsData);
                setAlerts(alertsData);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!metrics) {
        return <div>Failed to load dashboard data.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Command Center</h2>
            </div>

            <MetricsCards metrics={metrics} />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <TrendChart data={trends} />
                <div className="col-span-3 space-y-6">
                    <AlertsPanel alerts={alerts} />
                    <QuickActions />
                </div>
            </div>
        </div>
    );
}

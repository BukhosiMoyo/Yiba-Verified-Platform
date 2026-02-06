"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EngagementStateBadge } from "./EngagementStateBadge";
import { EngagementScoreGauge } from "./EngagementScoreGauge";
import { Loader2, TrendingUp, Users, Target, Activity } from "lucide-react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import type { EngagementState } from "@prisma/client";

interface EngagementStats {
    summary: {
        totalInvites: number;
        totalEngaged: number;
        avgScore: number;
        activeRate: number;
        dormantCount: number;
    };
    funnel: {
        uncontacted: number;
        contacted: number;
        engaged: number;
        evaluating: number;
        ready: number;
        active: number;
    };
    conversionRates: {
        contactedToEngaged: number;
        engagedToReady: number;
        readyToActive: number;
    };
    stateDistribution: Array<{ state: EngagementState; count: number }>;
    scoreDistribution: Array<{ bucket: string; count: number }>;
    recentTransitions: Array<{
        inviteId: string;
        email: string;
        currentState: EngagementState;
        score: number;
        lastTransition: {
            from: string;
            to: string;
            timestamp: string;
            reason: string;
        } | null;
    }>;
    dailyTrends: Array<{
        date: string;
        contacted: number;
        engaged: number;
        active: number;
    }>;
}

const STATE_COLORS: Record<string, string> = {
    UNCONTACTED: "#9CA3AF",
    CONTACTED: "#3B82F6",
    ENGAGED: "#10B981",
    EVALUATING: "#F59E0B",
    READY: "#059669",
    ACTIVE: "#14B8A6",
    PAUSED: "#F97316",
    DECLINED: "#EF4444",
    DORMANT: "#6B7280",
    ARCHIVED: "#64748B",
};

export function EngagementTab() {
    const [stats, setStats] = useState<EngagementStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/platform-admin/invites/engagement-stats");
            if (!response.ok) throw new Error("Failed to fetch stats");
            const data = await response.json();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load stats");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center h-96 text-destructive">
                {error || "No data available"}
            </div>
        );
    }

    // Prepare funnel data
    const funnelData = [
        { name: "Uncontacted", value: stats.funnel.uncontacted },
        { name: "Contacted", value: stats.funnel.contacted },
        { name: "Engaged", value: stats.funnel.engaged },
        { name: "Ready", value: stats.funnel.ready },
        { name: "Active", value: stats.funnel.active },
    ];

    // Prepare pie chart data
    const pieData = stats.stateDistribution.map(item => ({
        name: item.state,
        value: item.count,
    }));

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Engaged</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.totalEngaged}</div>
                        <p className="text-xs text-muted-foreground">
                            Engaged + Evaluating + Ready
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.avgScore}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all invites
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.activeRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            Conversion to active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dormant</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.dormantCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Require re-engagement
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Engagement Funnel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Engagement Funnel</CardTitle>
                        <CardDescription>Conversion through stages</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={funnelData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Contacted → Engaged:</span>
                                <span className="font-medium">{stats.conversionRates.contactedToEngaged.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Engaged → Ready:</span>
                                <span className="font-medium">{stats.conversionRates.engagedToReady.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Ready → Active:</span>
                                <span className="font-medium">{stats.conversionRates.readyToActive.toFixed(1)}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* State Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>State Distribution</CardTitle>
                        <CardDescription>Current engagement states</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATE_COLORS[entry.name] || "#CCCCCC"} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Score Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                    <CardDescription>Engagement score ranges</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stats.scoreDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bucket" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#10B981" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Daily Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Engagement Trends (30 Days)</CardTitle>
                    <CardDescription>Daily activity by state</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.dailyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="contacted" stroke="#3B82F6" />
                            <Line type="monotone" dataKey="engaged" stroke="#10B981" />
                            <Line type="monotone" dataKey="active" stroke="#14B8A6" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Recent Transitions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent State Transitions</CardTitle>
                    <CardDescription>Latest engagement changes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats.recentTransitions.map((transition) => (
                            <div
                                key={transition.inviteId}
                                className="flex items-center justify-between p-4 border rounded-lg"
                            >
                                <div className="flex-1">
                                    <p className="font-medium">{transition.email}</p>
                                    {transition.lastTransition && (
                                        <p className="text-sm text-muted-foreground">
                                            {transition.lastTransition.from} → {transition.lastTransition.to}
                                            {" • "}
                                            {new Date(transition.lastTransition.timestamp).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <EngagementScoreGauge score={transition.score} size="sm" showLabel={false} />
                                    <EngagementStateBadge state={transition.currentState} />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

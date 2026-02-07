"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DeclineReasonsChartProps {
    data: Array<{ reason: string; count: number }>;
    loading?: boolean;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function DeclineReasonsChart({ data, loading }: DeclineReasonsChartProps) {
    if (loading) {
        return (
            <Card className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    // Transform data for chart if needed, or use as is
    // Assuming API returns { reason: string, count: number }[]

    return (
        <Card className="h-[400px]">
            <CardHeader>
                <CardTitle>Decline Reasons</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        No decline data available.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="reason"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

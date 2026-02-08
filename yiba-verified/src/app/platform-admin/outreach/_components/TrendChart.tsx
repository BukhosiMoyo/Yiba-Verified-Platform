"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    AreaChart,
} from "recharts";

interface TrendDataPoint {
    date: string;
    opens: number;
    clicks: number;
    signups: number;
}

interface TrendChartProps {
    data: TrendDataPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
    return (
        <Card className="col-span-4 border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm animate-in fade-in duration-500">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Engagement Trends
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">30 Days</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pl-0 pr-4 pb-4">
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                        <XAxis
                            dataKey="date"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border border-border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
                                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                                {label ? new Date(label).toLocaleDateString() : 'Unknown'}
                                            </p>
                                            <div className="space-y-1">
                                                {payload.map((item) => (
                                                    <div key={item.name} className="flex items-center justify-between gap-4 text-sm">
                                                        <span className="flex items-center gap-2 text-muted-foreground">
                                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                            {item.name}
                                                        </span>
                                                        <span className="font-semibold text-foreground">
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="circle"
                            formatter={(value) => <span className="text-sm font-medium text-muted-foreground">{value}</span>}
                        />
                        <Area
                            type="monotone"
                            dataKey="opens"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#colorOpens)"
                            name="Opens"
                            activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="clicks"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#colorClicks)"
                            name="Clicks"
                            activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="signups"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            fill="url(#colorSignups)"
                            name="Signups"
                            activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}


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
        <Card className="col-span-4 border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm shadow-md animate-in fade-in duration-500">
            <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Engagement Trends (30 Days)
                </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                        <XAxis
                            dataKey="date"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border-0 bg-background/95 backdrop-blur-sm p-3 shadow-xl">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col col-span-2 border-b pb-2">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        Date
                                                    </span>
                                                    <span className="font-bold">
                                                        {label ? label : 'Unknown'}
                                                    </span>
                                                </div>
                                                {payload.map((item, index) => (
                                                    <div key={item.name} className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            {item.name}
                                                        </span>
                                                        <span className="font-bold text-lg" style={{ color: item.color }}>
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
                            wrapperStyle={{
                                paddingTop: '20px',
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="opens"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fill="url(#colorOpens)"
                            name="Opens"
                            activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="clicks"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="url(#colorClicks)"
                            name="Clicks"
                            activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="signups"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            fill="url(#colorSignups)"
                            name="Signups"
                            activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}


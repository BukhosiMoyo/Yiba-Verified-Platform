"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    TrendingUp,
    Mail,
    CheckCircle,
    Eye,
    MousePointer,
    MessageSquare,
    UserPlus,
    XCircle,
    Target,
    Clock,
} from "lucide-react";

interface MetricsCardsProps {
    metrics: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        responses: number;
        signups: number;
        declines: number;
        conversion_rate: number;
        avg_time_to_signup_hours: number;
    };
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
    const cards = [
        {
            title: "Sent",
            value: metrics.sent.toLocaleString(),
            icon: Mail,
            gradient: "from-blue-500 to-cyan-500",
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-600 dark:text-blue-400",
        },
        {
            title: "Delivered",
            value: metrics.delivered.toLocaleString(),
            rate: `${((metrics.delivered / metrics.sent) * 100).toFixed(1)}%`,
            icon: CheckCircle,
            gradient: "from-green-500 to-emerald-500",
            iconBg: "bg-green-500/10",
            iconColor: "text-green-600 dark:text-green-400",
        },
        {
            title: "Opened",
            value: metrics.opened.toLocaleString(),
            rate: `${((metrics.opened / metrics.delivered) * 100).toFixed(1)}%`,
            icon: Eye,
            gradient: "from-purple-500 to-pink-500",
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-600 dark:text-purple-400",
        },
        {
            title: "Clicked",
            value: metrics.clicked.toLocaleString(),
            rate: `${((metrics.clicked / metrics.opened) * 100).toFixed(1)}%`,
            icon: MousePointer,
            gradient: "from-orange-500 to-amber-500",
            iconBg: "bg-orange-500/10",
            iconColor: "text-orange-600 dark:text-orange-400",
        },
        {
            title: "Responses",
            value: metrics.responses.toLocaleString(),
            icon: MessageSquare,
            gradient: "from-cyan-500 to-teal-500",
            iconBg: "bg-cyan-500/10",
            iconColor: "text-cyan-600 dark:text-cyan-400",
        },
        {
            title: "Signups",
            value: metrics.signups.toLocaleString(),
            icon: UserPlus,
            gradient: "from-emerald-500 to-green-600",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            title: "Declines",
            value: metrics.declines.toLocaleString(),
            icon: XCircle,
            gradient: "from-red-500 to-rose-500",
            iconBg: "bg-red-500/10",
            iconColor: "text-red-600 dark:text-red-400",
        },
        {
            title: "Conversion Rate",
            value: `${metrics.conversion_rate.toFixed(2)}%`,
            icon: Target,
            gradient: "from-indigo-500 to-purple-600",
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-600 dark:text-indigo-400",
        },
        {
            title: "Avg Time to Signup",
            value: `${metrics.avg_time_to_signup_hours}h`,
            icon: Clock,
            gradient: "from-amber-500 to-yellow-500",
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-600 dark:text-amber-400",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-500">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <Card
                        key={card.title}
                        className="group relative overflow-hidden border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105"
                        style={{
                            animationDelay: `${index * 50}ms`,
                        }}
                    >
                        {/* Gradient overlay on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <div className={`${card.iconBg} p-2 rounded-lg transition-all duration-300 group-hover:scale-110`}>
                                <Icon className={`h-4 w-4 ${card.iconColor}`} />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="flex items-baseline gap-2">
                                <div className={`text-3xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                                    {card.value}
                                </div>
                                {card.rate && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <TrendingUp className="h-3 w-3" />
                                        {card.rate}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}


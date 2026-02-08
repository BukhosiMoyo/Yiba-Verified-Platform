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
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            title: "Delivered",
            value: metrics.delivered.toLocaleString(),
            rate: metrics.sent > 0 ? `${((metrics.delivered / metrics.sent) * 100).toFixed(1)}%` : "-",
            icon: CheckCircle,
            color: "text-green-500",
            bg: "bg-green-500/10",
        },
        {
            title: "Opened",
            value: metrics.opened.toLocaleString(),
            rate: metrics.delivered > 0 ? `${((metrics.opened / metrics.delivered) * 100).toFixed(1)}%` : "-",
            icon: Eye,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            title: "Clicked",
            value: metrics.clicked.toLocaleString(),
            rate: metrics.opened > 0 ? `${((metrics.clicked / metrics.opened) * 100).toFixed(1)}%` : "-",
            icon: MousePointer,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
        },
        {
            title: "Responses",
            value: metrics.responses.toLocaleString(),
            icon: MessageSquare,
            color: "text-cyan-500",
            bg: "bg-cyan-500/10",
        },
        {
            title: "Signups",
            value: metrics.signups.toLocaleString(),
            icon: UserPlus,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            title: "Declines",
            value: metrics.declines.toLocaleString(),
            icon: XCircle,
            color: "text-red-500",
            bg: "bg-red-500/10",
        },
        {
            title: "Conversion Rate",
            value: `${metrics.conversion_rate.toFixed(1)}%`,
            icon: Target,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
        },
        // Removed "Avg Time" to fit 8-card limit (2 rows of 4)
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in duration-500">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <Card
                        key={card.title}
                        className="group relative overflow-hidden border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm transition-all duration-200 hover:border-border hover:shadow-md"
                        style={{
                            animationDelay: `${index * 50}ms`,
                        }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <div className={`${card.bg} p-2 rounded-md transition-transform duration-200 group-hover:scale-110`}>
                                <Icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold text-foreground">
                                    {card.value}
                                </div>
                                {card.rate && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                        {card.rate.includes("-") ? (
                                            <span>{card.rate}</span>
                                        ) : (
                                            <>
                                                <TrendingUp className="h-3 w-3 text-muted-foreground/70" />
                                                {card.rate}
                                            </>
                                        )}
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


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
            color: "text-blue-600",
        },
        {
            title: "Delivered",
            value: metrics.delivered.toLocaleString(),
            rate: `${((metrics.delivered / metrics.sent) * 100).toFixed(1)}%`,
            icon: CheckCircle,
            color: "text-green-600",
        },
        {
            title: "Opened",
            value: metrics.opened.toLocaleString(),
            rate: `${((metrics.opened / metrics.delivered) * 100).toFixed(1)}%`,
            icon: Eye,
            color: "text-purple-600",
        },
        {
            title: "Clicked",
            value: metrics.clicked.toLocaleString(),
            rate: `${((metrics.clicked / metrics.opened) * 100).toFixed(1)}%`,
            icon: MousePointer,
            color: "text-orange-600",
        },
        {
            title: "Responses",
            value: metrics.responses.toLocaleString(),
            icon: MessageSquare,
            color: "text-cyan-600",
        },
        {
            title: "Signups",
            value: metrics.signups.toLocaleString(),
            icon: UserPlus,
            color: "text-emerald-600",
        },
        {
            title: "Declines",
            value: metrics.declines.toLocaleString(),
            icon: XCircle,
            color: "text-red-600",
        },
        {
            title: "Conversion Rate",
            value: `${metrics.conversion_rate.toFixed(2)}%`,
            icon: Target,
            color: "text-indigo-600",
        },
        {
            title: "Avg Time to Signup",
            value: `${metrics.avg_time_to_signup_hours}h`,
            icon: Clock,
            color: "text-amber-600",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <Icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            {card.rate && (
                                <p className="text-xs text-muted-foreground mt-1">{card.rate} rate</p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Alert as AlertType } from "@/lib/outreach/types";
import { cn } from "@/lib/utils";

interface AlertsPanelProps {
    alerts: AlertType[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case "DELIVERABILITY_DIP":
            case "BOUNCE_RATE":
            case "DELIVERABILITY":
                return AlertCircle;
            case "HIGH_DECLINES":
                return AlertTriangle;
            case "QUEUE_ISSUE":
            case "AI_OVERSIGHT":
                return Info;
            default:
                return CheckCircle;
        }
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case "HIGH":
                return {
                    container: "border-red-500/20 bg-red-500/5 hover:border-red-500/30",
                    icon: "text-red-500 bg-red-500/10",
                    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900"
                };
            case "MEDIUM":
                return {
                    container: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/30",
                    icon: "text-amber-500 bg-amber-500/10",
                    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900"
                };
            case "LOW":
                return {
                    container: "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/30",
                    icon: "text-blue-500 bg-blue-500/10",
                    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
                };
            default:
                return {
                    container: "border-border/40 bg-muted/40 hover:border-border",
                    icon: "text-muted-foreground bg-muted",
                    badge: "bg-muted text-muted-foreground border-border"
                };
        }
    };

    return (
        <Card className="col-span-3 border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm animate-in fade-in duration-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    System Alerts
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                            <div className="p-3 bg-muted rounded-full mb-3">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                            <p className="font-medium text-foreground">All systems healthy</p>
                            <p className="text-sm">No active alerts requiring attention</p>
                        </div>
                    ) : (
                        alerts.map((alert, index) => {
                            const Icon = getIcon(alert.type);
                            const styles = getSeverityStyles(alert.severity);
                            return (
                                <div
                                    key={alert.alert_id}
                                    className={cn(
                                        "flex items-start gap-4 rounded-lg border p-4 transition-all duration-200",
                                        styles.container
                                    )}
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                    }}
                                >
                                    <div className={cn("p-2 rounded-md", styles.icon)}>
                                        <Icon className="h-4 w-4" />
                                    </div>

                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium leading-none text-foreground">
                                                {alert.type.replace(/_/g, " ")}
                                            </p>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider",
                                                styles.badge
                                            )}>
                                                {alert.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {alert.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground/70">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


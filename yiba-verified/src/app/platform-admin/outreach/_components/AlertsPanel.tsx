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
                    container: "border-red-500/20 bg-red-500/5",
                    icon: "bg-gradient-to-br from-red-500 to-rose-600",
                    iconColor: "text-white",
                    pulse: "animate-pulse",
                };
            case "MEDIUM":
                return {
                    container: "border-amber-500/20 bg-amber-500/5",
                    icon: "bg-gradient-to-br from-amber-500 to-orange-600",
                    iconColor: "text-white",
                    pulse: "",
                };
            case "LOW":
                return {
                    container: "border-blue-500/20 bg-blue-500/5",
                    icon: "bg-gradient-to-br from-blue-500 to-cyan-600",
                    iconColor: "text-white",
                    pulse: "",
                };
            default:
                return {
                    container: "border-gray-500/20 bg-gray-500/5",
                    icon: "bg-gradient-to-br from-gray-500 to-gray-600",
                    iconColor: "text-white",
                    pulse: "",
                };
        }
    };

    return (
        <Card className="col-span-3 border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm shadow-md animate-in fade-in duration-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    System Alerts
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <div className="relative">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                                <CheckCircle className="relative h-12 w-12 text-green-500" />
                            </div>
                            <p className="mt-4 font-medium">All systems healthy</p>
                            <p className="text-sm">No active alerts</p>
                        </div>
                    ) : (
                        alerts.map((alert, index) => {
                            const Icon = getIcon(alert.type);
                            const styles = getSeverityStyles(alert.severity);
                            return (
                                <div
                                    key={alert.alert_id}
                                    className={cn(
                                        "flex items-start gap-4 rounded-xl border p-4 transition-all duration-300 hover:shadow-md",
                                        styles.container
                                    )}
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                    }}
                                >
                                    <div className="relative">
                                        {alert.severity === 'HIGH' && (
                                            <div className="absolute inset-0 bg-red-500/30 rounded-lg blur-md animate-pulse" />
                                        )}
                                        <div
                                            className={cn(
                                                "relative rounded-lg p-2 shadow-lg",
                                                styles.icon,
                                                styles.pulse
                                            )}
                                        >
                                            <Icon className={cn("h-5 w-5", styles.iconColor)} />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold leading-none">
                                                {alert.type.replace(/_/g, " ")}
                                            </p>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                                                alert.severity === 'HIGH' ? "bg-red-500/20 text-red-700 dark:text-red-300" :
                                                    alert.severity === 'MEDIUM' ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" :
                                                        "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                            )}>
                                                {alert.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {alert.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
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


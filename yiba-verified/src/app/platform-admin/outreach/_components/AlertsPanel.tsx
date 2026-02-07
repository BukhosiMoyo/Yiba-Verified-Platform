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
                return AlertCircle;
            case "HIGH_DECLINES":
                return AlertTriangle;
            case "QUEUE_ISSUE":
                return Info;
            default:
                return CheckCircle;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "HIGH":
                return "text-red-500 bg-red-50 dark:bg-red-900/10";
            case "MEDIUM":
                return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
            case "LOW":
                return "text-blue-500 bg-blue-50 dark:bg-blue-900/10";
            default:
                return "text-gray-500 bg-gray-50 dark:bg-gray-800";
        }
    };

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
                            <p>All systems healthy</p>
                        </div>
                    ) : (
                        alerts.map((alert) => {
                            const Icon = getIcon(alert.type);
                            return (
                                <div
                                    key={alert.alert_id}
                                    className="flex items-start space-x-4 rounded-md border p-4"
                                >
                                    <div
                                        className={cn(
                                            "mt-0.5 rounded-full p-1",
                                            getSeverityColor(alert.severity)
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {alert.type.replace(/_/g, " ")}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
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

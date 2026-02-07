import { DeliverabilityMetrics } from "@/lib/outreach/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthMetricsProps {
    metrics: DeliverabilityMetrics;
}

export function HealthMetrics({ metrics }: HealthMetricsProps) {
    const getStatusColor = (value: number, threshold: number, higherIsBad = true) => {
        const isBad = higherIsBad ? value > threshold : value < threshold;
        return isBad ? "text-red-500" : "text-green-500";
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                    <XCircle className={cn("h-4 w-4", getStatusColor(metrics.bounce_rate, 5))} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.bounce_rate}%</div>
                    <p className="text-xs text-muted-foreground">Target: &lt; 5%</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Complaint Rate</CardTitle>
                    <AlertTriangle className={cn("h-4 w-4", getStatusColor(metrics.complaint_rate, 0.1))} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.complaint_rate}%</div>
                    <p className="text-xs text-muted-foreground">Target: &lt; 0.1%</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                    <CheckCircle className={cn("h-4 w-4", getStatusColor(metrics.delivery_rate, 98, false))} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.delivery_rate}%</div>
                    <p className="text-xs text-muted-foreground">Target: &gt; 98%</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.open_rate}%</div>
                    <p className="text-xs text-muted-foreground">Click Rate: {metrics.click_rate}%</p>
                </CardContent>
            </Card>
        </div>
    );
}

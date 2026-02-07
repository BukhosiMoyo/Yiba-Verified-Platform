import { OversightMetrics } from "@/lib/outreach/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, AlertTriangle, ThumbsUp } from "lucide-react";

interface MetricsOverviewProps {
    metrics: OversightMetrics;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Emails Generated</CardTitle>
                    <Sparkles className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.total_generated_today}</div>
                    <p className="text-xs text-muted-foreground">Today</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.success_rate}%</div>
                    <p className="text-xs text-muted-foreground">Without intervention</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Intervention Rate</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.intervention_rate}%</div>
                    <p className="text-xs text-muted-foreground">Required manual fix</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Generation Time</CardTitle>
                    <Brain className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.avg_generation_time_ms}ms</div>
                    <p className="text-xs text-muted-foreground">Per email</p>
                </CardContent>
            </Card>
        </div>
    );
}

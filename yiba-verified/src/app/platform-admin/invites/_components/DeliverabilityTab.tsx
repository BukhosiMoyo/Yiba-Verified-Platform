"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DeliverabilityTab() {
    const checkList = [
        { name: "SPF Configuration", status: "PASS", details: "v=spf1 include:resend.com ~all" },
        { name: "DKIM Configuration", status: "PASS", details: "Verified (resend._domainkey)" },
        { name: "DMARC Configuration", status: "WARN", details: "Found but policy is 'none'" },
        { name: "Sending Domain", status: "PASS", details: "yibaverified.co.za" },
        { name: "Rate Limiting", status: "PASS", details: "Active (100/hr global)" },
    ];

    const getIcon = (status: string) => {
        if (status === "PASS") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        if (status === "WARN") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
        return <XCircle className="h-5 w-5 text-red-500" />;
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Domain Health
                        </CardTitle>
                        <CardDescription>DNS and authentication status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {checkList.map((item, i) => (
                            <div key={i} className="flex items-start justify-between border-b pb-3 last:border-0">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 font-medium">
                                        {getIcon(item.status)}
                                        {item.name}
                                    </div>
                                    <p className="text-sm text-muted-foreground pl-7">{item.details}</p>
                                </div>
                                <Badge variant={item.status === 'PASS' ? 'outline' : 'secondary'}>{item.status}</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Current sending configuration</CardTitle>
                        <CardDescription>Applied rules for new campaigns</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted rounded-md text-center">
                                <div className="text-xl font-bold">25</div>
                                <div className="text-xs text-muted-foreground">Batch Size</div>
                            </div>
                            <div className="p-3 bg-muted rounded-md text-center">
                                <div className="text-xl font-bold">100</div>
                                <div className="text-xs text-muted-foreground">Max / Hour</div>
                            </div>
                            <div className="p-3 bg-muted rounded-md text-center">
                                <div className="text-xl font-bold">10</div>
                                <div className="text-xs text-muted-foreground">Per Domain / Batch</div>
                            </div>
                            <div className="p-3 bg-muted rounded-md text-center">
                                <div className="text-xl font-bold">10s</div>
                                <div className="text-xs text-muted-foreground">Jitter</div>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-4">
                            <p>These settings are controlled by environment variables and can be overridden per campaign.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

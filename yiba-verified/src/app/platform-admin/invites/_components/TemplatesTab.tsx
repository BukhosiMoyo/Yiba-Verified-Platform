"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Copy } from "lucide-react";

export function TemplatesTab() {
    const templates = [
        { id: "1", name: "Default Invite", subject: "You're invited to Yiba Verified", used: 12 },
        { id: "2", name: "Institution Admin Onboarding", subject: "Complete your institution profile", used: 5 },
        { id: "3", name: "Student Pilot", subject: "Join the QCTO Pilot Program", used: 8 },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Email Templates</h3>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map(t => (
                    <Card key={t.id}>
                        <CardHeader>
                            <CardTitle className="text-base">{t.name}</CardTitle>
                            <CardDescription className="line-clamp-1">{t.subject}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between text-sm text-muted-foreground mb-4">
                                <span>Used in {t.used} campaigns</span>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm"><Edit className="h-3 w-3 mr-1" /> Edit</Button>
                                <Button variant="outline" size="sm"><Copy className="h-3 w-3 mr-1" /> Clone</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

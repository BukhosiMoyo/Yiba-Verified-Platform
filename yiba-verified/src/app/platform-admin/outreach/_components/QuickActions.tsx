"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Play, Pause, FileSearch } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/platform-admin/outreach/pipeline?action=upload">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload List
                    </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/platform-admin/outreach/deliverability">
                        <Play className="mr-2 h-4 w-4" />
                        Start Batch
                    </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/platform-admin/outreach/deliverability">
                        <Pause className="mr-2 h-4 w-4" />
                        Pause Campaign
                    </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/platform-admin/outreach/ai">
                        <FileSearch className="mr-2 h-4 w-4" />
                        Review AI Drafts
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

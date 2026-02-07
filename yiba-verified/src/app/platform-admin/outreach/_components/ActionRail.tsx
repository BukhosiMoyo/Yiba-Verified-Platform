"use client";

import { InstitutionOutreachProfile } from "@/lib/outreach/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Ban,
    MailPlus,
    ArrowRight,
    ShieldAlert,
    Archive,
    CheckCircle,
    FileQuestion,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface ActionRailProps {
    institution: InstitutionOutreachProfile;
}

export function ActionRail({ institution }: ActionRailProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Button className="w-full justify-start" variant="outline">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Override Stage
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                        <MailPlus className="mr-2 h-4 w-4" />
                        Send Manual Email
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                        <FileQuestion className="mr-2 h-4 w-4" />
                        View Questionnaire Answers
                    </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                        Governance
                    </div>
                    <Button
                        className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/10"
                        variant="ghost"
                    >
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        {institution.status_flags.ai_suppressed
                            ? "Enable AI Outreach"
                            : "Suppress AI Outreach"}
                    </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                        Outcome
                    </div>
                    <Button
                        className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/10"
                        variant="ghost"
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Converted
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                                variant="ghost"
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                Mark as Declined
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem>Not Interested</DropdownMenuItem>
                            <DropdownMenuItem>Budget Constraints</DropdownMenuItem>
                            <DropdownMenuItem>Timing</DropdownMenuItem>
                            <DropdownMenuItem>Already Using Competitor</DropdownMenuItem>
                            <DropdownMenuItem>Other</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        className="w-full justify-start text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        variant="ghost"
                    >
                        <Archive className="mr-2 h-4 w-4" />
                        Not Eligible / Archive
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

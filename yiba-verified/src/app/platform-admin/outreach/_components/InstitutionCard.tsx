"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MoreHorizontal, ArrowRight, XCircle, Loader2 } from "lucide-react";
import { InstitutionOutreachProfile, EngagementStage } from "@/lib/outreach/types";
import { StageBadge } from "./StageBadge";
import { StatusIcon } from "./StatusIcon";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EngagementScoreGauge } from "../../invites/_components/EngagementScoreGauge";
import { awarenessApi } from "@/lib/outreach/api";
import { toast } from "sonner";

interface InstitutionCardProps {
    institution: InstitutionOutreachProfile;
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleMoveToNext = async () => {
        setLoading(true);
        try {
            // Determine next stage logic (simplified for now)
            const stages = Object.values(EngagementStage);
            const currentIndex = stages.indexOf(institution.engagement_stage);
            const nextStage = stages[currentIndex + 1];

            if (nextStage) {
                await awarenessApi.updateStage(institution.institution_id, nextStage);
                toast.success(`Moved to ${nextStage}`);
                router.refresh();
            } else {
                toast.info("Already at final stage");
            }
        } catch (error) {
            toast.error("Failed to move stage");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = async () => {
        setLoading(true);
        try {
            await awarenessApi.updateStage(institution.institution_id, EngagementStage.DECLINED);
            toast.success("Marked as declined");
            router.refresh();
        } catch (error) {
            toast.error("Failed to decline");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="group cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all duration-200 border border-border hover:border-primary/40 bg-card hover:bg-muted/30">
            <CardHeader className="p-1 pb-0 flex flex-row items-center justify-between space-y-0">
                <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1 mb-0.5">
                        <StatusIcon status={institution.status_flags} className="h-2.5 w-2.5 flex-shrink-0" />
                        <Link
                            href={`/platform-admin/outreach/institutions/${institution.institution_id}`}
                            className="font-medium hover:underline hover:text-primary truncate block text-xs leading-tight"
                            title={institution.institution_name}
                        >
                            {institution.institution_name}
                        </Link>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="truncate max-w-[120px]" title={institution.contacts?.[0]?.email}>{institution.contacts?.[0]?.email || 'No Email'}</span>
                        <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                        <span className="truncate">{institution.province}</span>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-2.5 w-2.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/platform-admin/outreach/institutions/${institution.institution_id}`}>
                                View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleMoveToNext} disabled={loading}>
                            <ArrowRight className="h-3 w-3 mr-2" />
                            Move to Next Stage
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDecline} disabled={loading} className="text-red-600 focus:text-red-600">
                            <XCircle className="h-3 w-3 mr-2" />
                            Mark as Declined
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-1 pt-0 flex items-center justify-between pb-1">
                <div className="flex items-center text-[10px] text-muted-foreground">
                    <Calendar className="mr-1 h-2.5 w-2.5 opacity-70" />
                    {new Date(institution.last_activity).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1.5">
                    {loading && <Loader2 className="h-2 w-2 animate-spin text-primary mr-1" />}
                    <div className="scale-75 origin-right">
                        <EngagementScoreGauge score={institution.engagement_score} size="sm" showLabel={false} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

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
        <Card className="group cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all duration-200 border border-border/40 hover:border-primary/40 bg-background hover:bg-accent/5">
            <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
                <div className="flex-1 overflow-hidden">
                    <Link
                        href={`/platform-admin/outreach/institutions/${institution.institution_id}`}
                        className="font-medium hover:underline hover:text-primary truncate block text-sm"
                    >
                        {institution.institution_name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        {institution.province}
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
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
            <CardContent className="p-3 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                        <StatusIcon status={institution.status_flags} />
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {institution.domain}
                        </span>
                    </div>
                    <EngagementScoreGauge score={institution.engagement_score} size="sm" showLabel={false} />
                </div>
            </CardContent>
            <CardFooter className="p-3 pt-0 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/30 mt-2 pt-2">
                <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3 opacity-70" />
                    {new Date(institution.last_activity).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                    {loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    <span>{institution.contacts.length} contact{institution.contacts.length !== 1 ? "s" : ""}</span>
                </div>
            </CardFooter>
        </Card>
    );
}

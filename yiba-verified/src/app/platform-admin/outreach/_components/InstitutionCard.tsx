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
    onMenuOpen?: (open: boolean) => void;
}

export function InstitutionCard({ institution, onMenuOpen }: InstitutionCardProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleMoveToNext = async () => {
        setLoading(true);
        try {
            const stages = Object.values(EngagementStage);
            const currentIndex = stages.indexOf(institution.engagement_stage);
            const nextStage = stages[currentIndex + 1];

            if (nextStage) {
                await awarenessApi.updateInviteStage(institution.id, nextStage);
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
            await awarenessApi.updateInviteStage(institution.id, EngagementStage.DECLINED);
            toast.success("Marked as declined");
            router.refresh();
        } catch (error) {
            toast.error("Failed to decline");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Card should represent a contact journey.
    // We assume data integrity: email exists.
    const primaryContact = institution.contacts[0];
    // Fallback just in case, but API will strictly filter.
    const email = primaryContact?.email || institution.contacts[0]?.email || "Missing Email";

    return (
        <Card className="group cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all duration-200 border border-border hover:border-primary/40 bg-card hover:bg-muted/30">
            <CardContent className="p-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                        {/* Institution Name */}
                        <Link
                            href={`/platform-admin/outreach/institutions/${institution.institution_id}`}
                            className="font-semibold text-sm hover:underline hover:text-primary truncate block mb-0.5 text-foreground leading-tight"
                            title={institution.institution_name}
                        >
                            {institution.institution_name}
                        </Link>

                        {/* Mandatory Email */}
                        <div className="text-xs text-foreground/90 font-medium truncate mb-1.5" title={email}>
                            {email}
                        </div>

                        {/* Secondary Info: Province + Date */}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="truncate max-w-[80px]">{institution.province}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                            <div className="flex items-center">
                                <Calendar className="mr-1 h-2.5 w-2.5 opacity-70" />
                                {new Date(institution.last_activity).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex flex-col items-end gap-2">
                        <DropdownMenu onOpenChange={(open) => onMenuOpen?.(open)}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-3 w-3" />
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

                        {/* Engagement Score */}
                        <div className="scale-90 origin-right">
                            <EngagementScoreGauge score={institution.engagement_score} size="sm" showLabel={false} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

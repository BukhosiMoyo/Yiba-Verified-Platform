import Link from "next/link";
import { Calendar, MoreHorizontal } from "lucide-react";
import { InstitutionOutreachProfile } from "@/lib/outreach/types";
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
import { EngagementScoreGauge } from "../../invites/_components/EngagementScoreGauge"; // Reuse existing

interface InstitutionCardProps {
    institution: InstitutionOutreachProfile;
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
    return (
        <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
            <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
                <div className="flex-1 overflow-hidden">
                    <Link
                        href={`/platform-admin/outreach/institutions/${institution.institution_id}`}
                        className="font-medium hover:underline truncate block"
                    >
                        {institution.institution_name}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                        {institution.province}
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-6 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Move to Next Stage</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                            Mark as Declined
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-3 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <StatusIcon status={institution.status_flags} />
                        <span className="text-xs text-muted-foreground">
                            {institution.domain}
                        </span>
                    </div>
                    <EngagementScoreGauge score={institution.engagement_score} size="sm" showLabel={false} />
                </div>
            </CardContent>
            <CardFooter className="p-3 pt-0 flex items-center justify-between text-xs text-muted-foreground border-t mt-2 pt-2">
                <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(institution.last_activity).toLocaleDateString()}
                </div>
                <div>
                    {institution.contacts.length} contact{institution.contacts.length !== 1 ? "s" : ""}
                </div>
            </CardFooter>
        </Card>
    );
}

import { InstitutionOutreachProfile } from "@/lib/outreach/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StageBadge } from "./StageBadge";
import { EngagementScoreGauge } from "../../invites/_components/EngagementScoreGauge"; // Verify path
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowRight, XCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { awarenessApi } from "@/lib/outreach/api";
import { EngagementStage } from "@/lib/outreach/types";
import { toast } from "sonner";
import { useState } from "react";

interface PipelineListProps {
    institutions: InstitutionOutreachProfile[];
}

export function PipelineList({ institutions }: PipelineListProps) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleMoveToNext = async (institution: InstitutionOutreachProfile) => {
        setLoadingId(institution.institution_id);
        try {
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
            setLoadingId(null);
        }
    };

    const handleDecline = async (institution: InstitutionOutreachProfile) => {
        setLoadingId(institution.institution_id);
        try {
            await awarenessApi.updateStage(institution.institution_id, EngagementStage.DECLINED);
            toast.success("Marked as declined");
            router.refresh();
        } catch (error) {
            toast.error("Failed to decline");
            console.error(error);
        } finally {
            setLoadingId(null);
        }
    };

    if (institutions.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground bg-muted/10">
                <p>No institutions found matching current filters.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Institution</TableHead>
                        <TableHead>Province</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {institutions.map((inst) => (
                        <TableRow key={inst.institution_id}>
                            <TableCell className="font-medium">
                                <Link
                                    href={`/platform-admin/outreach/institutions/${inst.institution_id}`}
                                    className="hover:underline hover:text-primary transition-colors"
                                >
                                    {inst.institution_name}
                                </Link>
                                <div className="text-xs text-muted-foreground mt-0.5">{inst.domain}</div>
                            </TableCell>
                            <TableCell>{inst.province}</TableCell>
                            <TableCell>
                                <StageBadge stage={inst.engagement_stage} />
                            </TableCell>
                            <TableCell>
                                {new Date(inst.last_activity).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <EngagementScoreGauge score={inst.engagement_score} size="sm" showLabel={false} />
                                    <span className="text-xs text-muted-foreground">{inst.engagement_score}%</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/platform-admin/outreach/institutions/${inst.institution_id}`}>
                                                View Details
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleMoveToNext(inst)}
                                            disabled={loadingId === inst.institution_id}
                                        >
                                            <ArrowRight className="h-3 w-3 mr-2" />
                                            Move to Next Stage
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleDecline(inst)}
                                            disabled={loadingId === inst.institution_id}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <XCircle className="h-3 w-3 mr-2" />
                                            Mark as Declined
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

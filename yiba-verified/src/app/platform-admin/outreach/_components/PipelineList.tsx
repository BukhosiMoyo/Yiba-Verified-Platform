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
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { PROVINCES } from "@/lib/provinces";

interface PipelineListProps {
    institutions: InstitutionOutreachProfile[];
}

export function PipelineList({ institutions }: PipelineListProps) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [provinceFilter, setProvinceFilter] = useState<string>("all");
    const [stageFilter, setStageFilter] = useState<string>("all");
    const [engagementFilter, setEngagementFilter] = useState<string>("all");
    const [activityFilter, setActivityFilter] = useState<string>("all");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filtered and Paginated data
    const filteredInstitutions = useMemo(() => {
        return institutions.filter((inst) => {
            const matchesSearch = inst.institution_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inst.domain.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProvince = provinceFilter === "all" || inst.province === provinceFilter;
            const matchesStage = stageFilter === "all" || inst.engagement_stage === stageFilter;

            const matchesEngagement = engagementFilter === "all" || (
                engagementFilter === "high" ? inst.engagement_score >= 80 :
                    engagementFilter === "medium" ? (inst.engagement_score >= 40 && inst.engagement_score < 80) :
                        engagementFilter === "low" ? inst.engagement_score < 40 : true
            );

            let matchesActivity = true;
            if (activityFilter !== "all") {
                const lastDate = new Date(inst.last_activity);
                const now = new Date();
                const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

                if (activityFilter === "today") matchesActivity = diffDays <= 1;
                else if (activityFilter === "7d") matchesActivity = diffDays <= 7;
                else if (activityFilter === "30d") matchesActivity = diffDays <= 30;
            }

            return matchesSearch && matchesProvince && matchesStage && matchesEngagement && matchesActivity;
        });
    }, [institutions, searchQuery, provinceFilter, stageFilter, engagementFilter, activityFilter]);

    const totalPages = Math.ceil(filteredInstitutions.length / pageSize);
    const paginatedInstitutions = filteredInstitutions.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

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
        <div className="space-y-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-3 rounded-lg border border-border">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or domain..."
                        className="pl-9 h-9"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <Select
                    value={provinceFilter}
                    onValueChange={(val) => {
                        setProvinceFilter(val);
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="Province" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Provinces</SelectItem>
                        {PROVINCES.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={stageFilter}
                    onValueChange={(val) => {
                        setStageFilter(val);
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="w-[150px] h-9">
                        <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {Object.values(EngagementStage).map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={engagementFilter}
                    onValueChange={(val) => {
                        setEngagementFilter(val);
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="w-[150px] h-9">
                        <SelectValue placeholder="Engagement" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Engagement</SelectItem>
                        <SelectItem value="high">High (80%+)</SelectItem>
                        <SelectItem value="medium">Medium (40-79%)</SelectItem>
                        <SelectItem value="low">Low (&lt;40%)</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={activityFilter}
                    onValueChange={(val) => {
                        setActivityFilter(val);
                        setCurrentPage(1);
                    }}
                >
                    <SelectTrigger className="w-[150px] h-9">
                        <SelectValue placeholder="Last Activity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Any Time</SelectItem>
                        <SelectItem value="today">Last 24h</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[300px]">Institution</TableHead>
                            <TableHead>Province</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Last Activity</TableHead>
                            <TableHead>Engagement</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedInstitutions.length > 0 ? (
                            paginatedInstitutions.map((inst) => (
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
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Rows per page:</span>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(val) => {
                            setPageSize(parseInt(val));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[70px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="ml-4">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredInstitutions.length)} of {filteredInstitutions.length}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Simple pagination logic for now
                            let pageNum = i + 1;
                            if (totalPages > 5 && currentPage > 3) {
                                pageNum = currentPage - 2 + i;
                                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                            }
                            if (pageNum <= 0) return null;
                            if (pageNum > totalPages) return null;

                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "secondary" : "ghost"}
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handlePageChange(pageNum)}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

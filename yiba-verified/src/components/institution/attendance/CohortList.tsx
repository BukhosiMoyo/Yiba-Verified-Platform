
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, Users, Eye, MoreHorizontal, Settings } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateCohortModal } from "./CreateCohortModal";
import { cn } from "@/lib/utils";

type Cohort = {
    cohort_id: string;
    name: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    qualification: {
        code: string;
        title: string;
    };
    _count: {
        enrolments: number;
    };
};

export function CohortList() {
    const router = useRouter();
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchCohorts();
    }, []);

    const fetchCohorts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/institution/cohorts");
            if (res.ok) {
                const data = await res.json();
                setCohorts(data);
            }
        } catch (error) {
            console.error("Failed to fetch cohorts:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCohorts = cohorts.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.qualification.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Cohorts</h2>
                    <p className="text-muted-foreground">
                        Manage student groups and training schedules.
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Cohort
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search cohorts or qualifications..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cohort Name</TableHead>
                                <TableHead>Qualification</TableHead>
                                <TableHead>Learners</TableHead>
                                <TableHead>Schedule</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredCohorts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No cohorts found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCohorts.map((cohort) => (
                                    <TableRow key={cohort.cohort_id}>
                                        <TableCell className="font-medium">
                                            {cohort.name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="truncate max-w-[200px]" title={cohort.qualification.name}>
                                                    {cohort.qualification.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{cohort.qualification.code}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{cohort._count.enrolments}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                {cohort.start_date ? (
                                                    <span className="text-muted-foreground">
                                                        {format(new Date(cohort.start_date), "MMM d, yyyy")} - {cohort.end_date ? format(new Date(cohort.end_date), "MMM d, yyyy") : "Ongoing"}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Not scheduled</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={cohort.status === "ACTIVE" ? "default" : "secondary"}>
                                                {cohort.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/institution/attendance/cohorts/${cohort.cohort_id}`)}>
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        View Sessions
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/institution/attendance/cohorts/${cohort.cohort_id}/learners`)}>
                                                        <Users className="mr-2 h-4 w-4" />
                                                        Manage Learners
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/institution/attendance/cohorts/${cohort.cohort_id}/settings`)}>
                                                        <Settings className="mr-2 h-4 w-4" />
                                                        Settings
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <CreateCohortModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onSuccess={fetchCohorts}
            />
        </div>
    );
}

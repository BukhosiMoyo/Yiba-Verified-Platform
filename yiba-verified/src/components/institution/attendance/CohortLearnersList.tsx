
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, UserMinus, MoreHorizontal } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddLearnerModal } from "./AddLearnerModal";

type Learner = {
    enrolment_id: string;
    learner: {
        first_name: string;
        last_name: string;
        national_id: string;
        email: string | null;
    };
};

interface CohortLearnersListProps {
    cohortId: string;
}

export function CohortLearnersList({ cohortId }: CohortLearnersListProps) {
    const router = useRouter();
    const [learners, setLearners] = useState<Learner[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchLearners();
    }, [cohortId]);

    const fetchLearners = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/institution/cohorts/${cohortId}/enrolments`);
            if (res.ok) {
                const data = await res.json();
                setLearners(data);
            }
        } catch (error) {
            console.error("Failed to fetch learners:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLearners = learners.filter((l) =>
        l.learner.first_name.toLowerCase().includes(search.toLowerCase()) ||
        l.learner.last_name.toLowerCase().includes(search.toLowerCase()) ||
        l.learner.national_id.includes(search)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Cohort Learners</h3>
                <Button onClick={() => setShowAddModal(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Learners
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search learners..."
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
                                <TableHead>First Name</TableHead>
                                <TableHead>Last Name</TableHead>
                                <TableHead>ID Number</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredLearners.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No learners assigned to this cohort yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLearners.map((item) => (
                                    <TableRow key={item.enrolment_id}>
                                        <TableCell className="font-medium">{item.learner.first_name}</TableCell>
                                        <TableCell>{item.learner.last_name}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.learner.national_id}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.learner.email || "-"}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="text-red-600">
                                                        <UserMinus className="mr-2 h-4 w-4" />
                                                        Remove from Cohort
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

            <AddLearnerModal
                cohortId={cohortId}
                open={showAddModal}
                onOpenChange={setShowAddModal}
                onSuccess={fetchLearners}
            />
        </div>
    );
}

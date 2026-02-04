
"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AddLearnerModalProps {
    cohortId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

type AvailableLearner = {
    enrolment_id: string;
    learner: {
        first_name: string;
        last_name: string;
        national_id: string;
    };
};

export function AddLearnerModal({ cohortId, open, onOpenChange, onSuccess }: AddLearnerModalProps) {
    const [available, setAvailable] = useState<AvailableLearner[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (open) {
            fetchAvailable();
            setSelected(new Set());
        }
    }, [open]);

    const fetchAvailable = async () => {
        setFetching(true);
        try {
            const res = await fetch(`/api/institution/cohorts/${cohortId}/available-learners`);
            if (res.ok) {
                const data = await res.json();
                setAvailable(data);
            }
        } catch (error) {
            console.error("Failed to fetch available learners", error);
        } finally {
            setFetching(false);
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    };

    const toggleAll = () => {
        if (selected.size === available.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(available.map(a => a.enrolment_id)));
        }
    };

    const handleSubmit = async () => {
        if (selected.size === 0) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/institution/cohorts/${cohortId}/enrolments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    enrolment_ids: Array.from(selected)
                }),
            });

            if (!res.ok) throw new Error("Failed to add learners");

            toast.success(`${selected.size} learners added successfully`);
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Add Learners to Cohort</DialogTitle>
                    <DialogDescription>
                        Select learners to add. Only active learners enrolled in the same qualification and not currently in a cohort are shown.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto border rounded-md min-h-[300px]">
                    {fetching ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                            <span className="text-muted-foreground">Loading available learners...</span>
                        </div>
                    ) : available.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            No eligible learners found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selected.size === available.length && available.length > 0}
                                            onCheckedChange={toggleAll}
                                        />
                                    </TableHead>
                                    <TableHead>Learner</TableHead>
                                    <TableHead>National ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {available.map(item => (
                                    <TableRow key={item.enrolment_id}
                                        data-state={selected.has(item.enrolment_id) ? "selected" : undefined}
                                        onClick={() => toggleSelect(item.enrolment_id)}
                                        className="cursor-pointer"
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selected.has(item.enrolment_id)}
                                                onCheckedChange={() => toggleSelect(item.enrolment_id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {item.learner.first_name} {item.learner.last_name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {item.learner.national_id}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading || selected.size === 0} onClick={handleSubmit}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Selected ({selected.size})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

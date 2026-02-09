"use client";

import { RecoveryCandidate } from "@/lib/outreach/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { awarenessApi } from "@/lib/outreach/api";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface RecoveryQueueProps {
    candidates: RecoveryCandidate[];
    onRecover: (id: string, strategy: string) => void;
    onDismiss: (id: string) => void;
}

export function RecoveryQueue({ candidates, onRecover, onDismiss }: RecoveryQueueProps) {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleRecover = async (id: string, strategy: string) => {
        setProcessingId(id);
        await onRecover(id, strategy);
        setProcessingId(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recovery Queue (Soft Declines)</CardTitle>
                <CardDescription>
                    Institutions that declined but may be eligible for re-engagement
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-border/40 bg-card overflow-hidden">
                    <Table className="bg-card">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Institution</TableHead>
                                <TableHead>Original Reason</TableHead>
                                <TableHead>Declined At</TableHead>
                                <TableHead>Suggested Strategy</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {candidates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No recovery candidates found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                candidates.map((candidate) => (
                                    <TableRow key={candidate.institution_id}>
                                        <TableCell className="font-medium">
                                            {candidate.institution_name}
                                        </TableCell>
                                        <TableCell>{candidate.reason}</TableCell>
                                        <TableCell>
                                            {new Date(candidate.declined_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{candidate.suggested_strategy}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleRecover(candidate.institution_id, candidate.suggested_strategy)}
                                                disabled={processingId === candidate.institution_id}
                                            >
                                                {processingId === candidate.institution_id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                )}
                                                Recover
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDismiss(candidate.institution_id)}
                                                disabled={processingId === candidate.institution_id}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

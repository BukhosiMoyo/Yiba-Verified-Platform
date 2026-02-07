import { useState } from "react";
import { FlaggedContent } from "@/lib/outreach/types";
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
import { Check, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FlaggedContentListProps {
    items: FlaggedContent[];
    onReview: (id: string, action: "approve" | "reject", feedback?: string) => void;
}

export function FlaggedContentList({ items, onReview }: FlaggedContentListProps) {
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState("");

    const handleRejectClick = (id: string) => {
        setRejectingId(id);
        setFeedback("");
    };

    const confirmRejection = () => {
        if (rejectingId) {
            onReview(rejectingId, "reject", feedback);
            setRejectingId(null);
            setFeedback("");
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-red-500 flex items-center gap-2">
                        Safety Review Queue
                        <Badge variant="destructive" className="ml-auto">
                            {items.length} Pending
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Content flagged by safety filters requiring manual review
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Reason</TableHead>
                                <TableHead>Snippet</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No flagged content pending review.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.flag_id}>
                                        <TableCell>
                                            <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                                                {item.violation_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <div className="truncate text-xs font-mono bg-muted p-1 rounded" title={item.content_snippet}>
                                                {item.content_snippet}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs">
                                                {(item.confidence_score * 100).toFixed(0)}%
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onReview(item.flag_id, "approve")}
                                                className="text-green-600 hover:text-green-600 hover:bg-green-50"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRejectClick(item.flag_id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Reject Content & Improve AI
                        </DialogTitle>
                        <DialogDescription>
                            Provide feedback to help the AI understand why this content was flagged incorrectly or generated poorly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="feedback">Correction / Policy Update</Label>
                            <Textarea
                                id="feedback"
                                placeholder="E.g., 'Do not use aggressive sales language like this.' or 'This looks fine, false positive on tone check.'"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectingId(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmRejection}>
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
